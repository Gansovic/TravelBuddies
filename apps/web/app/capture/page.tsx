'use client';

import { useState, useRef, useEffect } from 'react';
import { MomentService, OfflineStorageService, MetadataExtractionService } from '@travelbuddies/utils';
import type { MomentType, CreateMomentInput } from '@travelbuddies/utils';
import { useCollaboration } from '../../lib/hooks/useCollaboration';

/**
 * Capture Page - Main interface for recording moments
 * Provides capture modes: photo, video, voice, text, checkin
 * Supports offline-first recording with automatic sync
 */
export default function CapturePage() {
  const [mode, setMode] = useState<MomentType>('photo');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const momentService = MomentService.getInstance();
  const offlineStorage = OfflineStorageService.getInstance();
  const metadataService = MetadataExtractionService.getInstance();
  
  // Real-time collaboration
  const tripId = 'current-trip-id'; // TODO: Get from route/context
  const userId = 'current-user-id'; // TODO: Get from auth context
  const { activeUsers, broadcastCaptureStart, broadcastCaptureComplete, updateCaptureStatus } = useCollaboration(tripId, userId);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    getCurrentLocation();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  const initializeCamera = async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: mode === 'photo' || mode === 'video' ? {
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } : false,
        audio: mode === 'video' || mode === 'voice'
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current && (mode === 'photo' || mode === 'video')) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing camera/microphone:', err);
      setError('Could not access camera or microphone. Please check permissions.');
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
        },
        (error) => {
          console.warn('Could not get location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    try {
      // Broadcast capture start
      await broadcastCaptureStart('photo');
      await updateCaptureStatus(true, 'photo');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.9);
      });

      // Create moment with enhanced metadata
      const momentId = await createMoment('photo', blob);
      
      // Show capture feedback
      showCaptureSuccess();

      // Broadcast capture complete
      if (momentId) {
        await broadcastCaptureComplete(momentId);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo');
    } finally {
      setIsCapturing(false);
      await updateCaptureStatus(false);
    }
  };

  const startVideoRecording = async () => {
    if (!stream) return;

    try {
      setIsRecording(true);
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'video/webm' });
        await createMoment('video', blob);
        showCaptureSuccess();
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting video recording:', error);
      setError('Failed to start video recording');
      setIsRecording(false);
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!stream) {
      await initializeCamera(); // This will get audio stream
    }

    try {
      setIsRecording(true);
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream!, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await createMoment('voice', blob);
        showCaptureSuccess();
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting voice recording:', error);
      setError('Failed to start voice recording');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const createTextNote = async (text: string) => {
    await createMoment('text', undefined, text);
    showCaptureSuccess();
  };

  const createCheckin = async () => {
    await createMoment('checkin');
    showCaptureSuccess();
  };

  const createMoment = async (type: MomentType, file?: Blob, description?: string): Promise<string | null> => {
    try {
      let momentData: CreateMomentInput = {
        trip_id: tripId,
        type,
        description,
        captured_at: new Date(),
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
        altitude: location?.coords.altitude || undefined,
        location_accuracy_meters: location?.coords.accuracy,
        media_file: file ? new File([file], `moment-${Date.now()}.${getFileExtension(type)}`) : undefined
      };

      // Enhance with metadata if location is available
      if (location?.coords.latitude && location?.coords.longitude) {
        try {
          const metadata = await metadataService.extractLocationMetadata(
            location.coords.latitude,
            location.coords.longitude
          );
          
          // Merge metadata into moment data
          momentData = {
            ...momentData,
            // Location metadata will be added by the service
          };
        } catch (metadataError) {
          console.warn('Failed to extract metadata:', metadataError);
        }
      }

      if (offlineStorage.isOnline()) {
        // Create moment online
        const moment = await momentService.createMoment(momentData);
        if (moment) {
          console.log('Moment created:', moment.id);
          return moment.id;
        }
      } else {
        // Queue for offline upload
        const momentId = crypto.randomUUID();
        await offlineStorage.queueMoment({ ...momentData, id: momentId });
        console.log('Moment queued for upload:', momentId);
        return momentId;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating moment:', error);
      setError('Failed to save moment');
      return null;
    }
  };

  const getFileExtension = (type: MomentType): string => {
    switch (type) {
      case 'photo': return 'jpg';
      case 'video': return 'webm';
      case 'voice': return 'webm';
      default: return 'dat';
    }
  };

  const showCaptureSuccess = () => {
    // Show brief success feedback
    const successElement = document.createElement('div');
    successElement.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
    successElement.textContent = 'Moment captured!';
    document.body.appendChild(successElement);
    
    setTimeout(() => {
      document.body.removeChild(successElement);
    }, 2000);
  };

  const switchCamera = async () => {
    if (stream && videoRef.current) {
      const videoTrack = stream.getVideoTracks()[0];
      const facingMode = videoTrack.getSettings().facingMode === 'environment' ? 'user' : 'environment';
      
      // Stop current stream
      stream.getTracks().forEach(track => track.stop());
      
      // Start new stream with different facing mode
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: mode === 'video'
        });
        setStream(newStream);
        videoRef.current.srcObject = newStream;
      } catch (error) {
        console.error('Error switching camera:', error);
        // Fallback to original stream
        await initializeCamera();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <button 
          onClick={() => window.history.back()}
          className="text-gray-300 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Capture Moment</h1>
        
        {/* Live Collaboration Indicator */}
        <div className="flex items-center space-x-2">
          {activeUsers.length > 0 && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">{activeUsers.length} active</span>
            </div>
          )}
          <div className="w-8"></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-600 text-white rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Camera/Video Preview */}
      <div className="flex-1 relative overflow-hidden">
        {(mode === 'photo' || mode === 'video') && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Switch Button */}
            <button
              onClick={switchCamera}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              🔄
            </button>
          </>
        )}

        {mode === 'voice' && (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700'
              }`}>
                <span className="text-4xl">🎤</span>
              </div>
              <p className="text-gray-300">
                {isRecording ? 'Recording...' : 'Tap to record voice note'}
              </p>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="flex-1 p-4">
            <textarea
              placeholder="What's happening?"
              className="w-full h-64 p-4 bg-gray-800 text-white border border-gray-600 rounded-lg resize-none text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  createTextNote(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <p className="text-gray-400 text-sm mt-2">Press Cmd+Enter to save</p>
          </div>
        )}

        {mode === 'checkin' && (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center mb-4">
                <span className="text-4xl">📍</span>
              </div>
              <p className="text-gray-300 mb-4">Check in to this location</p>
              {location && (
                <p className="text-sm text-gray-500">
                  Accuracy: ±{Math.round(location.coords.accuracy)}m
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="bg-gray-900 p-4">
        <div className="flex justify-center space-x-6 mb-4">
          {(['photo', 'video', 'voice', 'text', 'checkin'] as MomentType[]).map((modeOption) => (
            <button
              key={modeOption}
              onClick={() => setMode(modeOption)}
              className={`px-4 py-2 rounded-lg capitalize ${
                mode === modeOption ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {modeOption}
            </button>
          ))}
        </div>

        {/* Capture Button */}
        <div className="flex justify-center">
          {mode === 'photo' && (
            <button
              onClick={capturePhoto}
              disabled={isCapturing || !stream}
              className={`w-16 h-16 rounded-full border-4 border-white ${
                isCapturing ? 'bg-gray-500' : 'bg-white'
              } disabled:opacity-50`}
            />
          )}

          {mode === 'video' && (
            <button
              onClick={isRecording ? stopVideoRecording : startVideoRecording}
              disabled={!stream}
              className={`w-16 h-16 rounded-full border-4 border-white ${
                isRecording ? 'bg-red-500' : 'bg-white'
              } disabled:opacity-50`}
            />
          )}

          {mode === 'voice' && (
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`w-16 h-16 rounded-full border-4 border-white ${
                isRecording ? 'bg-red-500' : 'bg-white'
              }`}
            />
          )}

          {mode === 'checkin' && (
            <button
              onClick={createCheckin}
              disabled={!location}
              className="w-16 h-16 rounded-full bg-blue-500 border-4 border-white disabled:opacity-50 flex items-center justify-center"
            >
              📍
            </button>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center mt-4">
          {mode === 'photo' && (
            <p className="text-gray-400">Tap circle to capture photo</p>
          )}
          {mode === 'video' && (
            <p className="text-gray-400">
              {isRecording ? 'Recording video...' : 'Tap circle to start recording'}
            </p>
          )}
          {mode === 'voice' && (
            <p className="text-gray-400">
              {isRecording ? 'Recording voice note...' : 'Tap circle to start recording'}
            </p>
          )}
          {mode === 'checkin' && (
            <p className="text-gray-400">Tap circle to check in here</p>
          )}
        </div>
      </div>
    </div>
  );
}