'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/lib/userContext';

// Review types that guide the user to create meaningful content
type ReviewType = 'restaurant' | 'accommodation' | 'activity' | 'transport' | 'place' | 'moment';

interface ReviewTemplate {
  type: ReviewType;
  icon: string;
  title: string;
  prompts: string[];
  ratingCategories?: string[];
}

const reviewTemplates: ReviewTemplate[] = [
  {
    type: 'restaurant',
    icon: '🍽️',
    title: 'Restaurant/Food',
    prompts: [
      'What did you eat?',
      'How was the atmosphere?',
      'Would you recommend it?',
      'What was the highlight?'
    ],
    ratingCategories: ['Food', 'Service', 'Atmosphere', 'Value']
  },
  {
    type: 'accommodation',
    icon: '🏨',
    title: 'Accommodation',
    prompts: [
      'How was your stay?',
      'What stood out?',
      'Any issues?',
      'Would you stay again?'
    ],
    ratingCategories: ['Cleanliness', 'Location', 'Comfort', 'Service']
  },
  {
    type: 'activity',
    icon: '🎯',
    title: 'Activity/Experience',
    prompts: [
      'What did you do?',
      'What was memorable?',
      'Any surprises?',
      'Tips for others?'
    ],
    ratingCategories: ['Fun', 'Value', 'Uniqueness', 'Organization']
  },
  {
    type: 'transport',
    icon: '🚗',
    title: 'Transport',
    prompts: [
      'How was the journey?',
      'Any delays or issues?',
      'Comfort level?',
      'Would you use again?'
    ],
    ratingCategories: ['Comfort', 'Punctuality', 'Value', 'Convenience']
  },
  {
    type: 'place',
    icon: '📍',
    title: 'Place/Landmark',
    prompts: [
      'What did you visit?',
      'What impressed you?',
      'How long did you stay?',
      'Best time to visit?'
    ],
    ratingCategories: ['Beauty', 'Interest', 'Accessibility', 'Crowds']
  },
  {
    type: 'moment',
    icon: '✨',
    title: 'Special Moment',
    prompts: [
      'What happened?',
      'Why was it special?',
      'Who was involved?',
      'How did you feel?'
    ]
  }
];

export default function TripReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const tripId = params.tripId as string;
  
  // Review state
  const [selectedTemplate, setSelectedTemplate] = useState<ReviewTemplate | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Reverse geocode
          fetch(`/api/places/reverse-geocode?lat=${position.coords.latitude}&lng=${position.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.place) {
                setLocationName(data.place.name);
              }
            })
            .catch(console.error);
        },
        (error) => console.warn('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 300000 }
      );
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRatingChange = (category: string, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (!reviewTitle.trim() && !reviewText.trim()) {
      alert('Please add a title or review text');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData for the API
      const formData = new FormData();
      formData.append('type', 'note'); // All reviews use 'note' type, template differentiates them
      formData.append('title', reviewTitle || `${selectedTemplate?.icon} ${selectedTemplate?.title} Review`);
      formData.append('description', reviewText);
      
      // Add metadata
      const metadata = {
        template: selectedTemplate?.type,
        ratings,
        overallRating,
        prompts_answered: currentPromptIndex,
        location_name: locationName
      };
      formData.append('metadata', JSON.stringify(metadata));
      
      if (location) {
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
      }
      
      // Add photos
      photos.forEach((photo, index) => {
        formData.append(`media_file`, photo);
      });
      
      // Add audio if recorded
      if (audioBlob) {
        formData.append('audio_file', audioBlob, 'review-audio.webm');
      }

      // Submit to API
      const response = await fetch(`/api/trip/${tripId}/memories`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Success! Navigate back to memories
        router.push(`/trip/${tripId}/memories`);
      } else {
        const error = await response.json();
        alert(`Failed to save review: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-2xl transition-colors"
          >
            {star <= value ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  );

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Experience</h1>
          <p className="text-gray-600 mb-8">What would you like to review from your trip?</p>
          
          <div className="grid grid-cols-2 gap-4">
            {reviewTemplates.map((template) => (
              <button
                key={template.type}
                onClick={() => setSelectedTemplate(template)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-left"
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-semibold text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {template.prompts[0]}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Change type
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{selectedTemplate.icon}</span>
            <span className="font-semibold">{selectedTemplate.title}</span>
          </div>
        </div>

        {/* Location indicator */}
        {locationName && (
          <div className="bg-white rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
            <span>📍</span>
            <span className="text-sm text-gray-600">{locationName}</span>
          </div>
        )}

        {/* Title Input */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <input
            type="text"
            placeholder="Give your review a title..."
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            className="w-full text-xl font-semibold placeholder-gray-400 outline-none"
          />
        </div>

        {/* Prompts Helper */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Need inspiration?</p>
          <div className="flex flex-wrap gap-2">
            {selectedTemplate.prompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setReviewText(prev => prev + (prev ? '\n\n' : '') + prompt + ' ');
                  setCurrentPromptIndex(Math.max(currentPromptIndex, index + 1));
                }}
                className="text-sm bg-white px-3 py-1 rounded-full text-blue-700 hover:bg-blue-100"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Main Review Text */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <textarea
            placeholder="Share your experience..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full h-32 resize-none outline-none placeholder-gray-400"
          />
          
          {/* Voice Recording */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2 rounded-lg font-medium ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isRecording ? '⏹️ Stop Recording' : '🎤 Record Voice Note'}
            </button>
            {audioBlob && (
              <span className="text-sm text-green-600">✓ Voice note recorded</span>
            )}
          </div>
        </div>

        {/* Ratings */}
        {selectedTemplate.ratingCategories && (
          <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
            <h3 className="font-semibold mb-4">Rate your experience</h3>
            {selectedTemplate.ratingCategories.map((category) => (
              <StarRating
                key={category}
                label={category}
                value={ratings[category] || 0}
                onChange={(v) => handleRatingChange(category, v)}
              />
            ))}
            <div className="pt-3 mt-3 border-t">
              <StarRating
                label="Overall"
                value={overallRating}
                onChange={setOverallRating}
              />
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
          <h3 className="font-semibold mb-4">Add Photos</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
            >
              <span className="text-3xl mb-1">📷</span>
              <span className="text-xs text-gray-500">Add Photo</span>
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Saving Review...
            </span>
          ) : (
            'Save Review'
          )}
        </button>
      </div>
    </div>
  );
}