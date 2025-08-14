'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RecapService, ExportService } from '@travelbuddies/utils';
import type { TripRecap, DailyRecap, RecapHighlight, VisualElement } from '@travelbuddies/utils';

/**
 * Recap Page - Trip recap and export functionality
 * Shows AI-generated trip summaries, highlights, and export options
 * Part of the memory recording MVP focused on recap generation
 */
export default function RecapPage() {
  const params = useParams();
  const tripId = params?.tripId as string;

  const [recap, setRecap] = useState<TripRecap | null>(null);
  const [dailyRecaps, setDailyRecaps] = useState<DailyRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [exportingData, setExportingData] = useState<string | null>(null);

  const recapService = RecapService.getInstance();
  const exportService = ExportService.getInstance();

  useEffect(() => {
    loadRecap();
  }, [tripId]);

  const loadRecap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load existing recap or generate new one
      const tripRecap = await recapService.generateRecap(tripId, {
        timeframe: 'trip',
        maxHighlights: 15,
        includeInsights: true,
        includeNarrative: true,
        includeVisuals: true
      });
      
      setRecap(tripRecap);
    } catch (error) {
      console.error('Error loading recap:', error);
      setError('Failed to load trip recap');
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecap = async () => {
    try {
      setGeneratingRecap(true);
      setError(null);
      
      const freshRecap = await recapService.generateRecap(tripId, {
        timeframe: 'trip',
        maxHighlights: 20,
        includeInsights: true,
        includeNarrative: true,
        includeVisuals: true
      });
      
      setRecap(freshRecap);
    } catch (error) {
      console.error('Error generating recap:', error);
      setError('Failed to generate new recap');
    } finally {
      setGeneratingRecap(false);
    }
  };

  const exportData = async (format: 'zip' | 'pdf' | 'gpx' | 'json') => {
    try {
      setExportingData(format);
      
      let blob: Blob;
      let filename: string;
      
      switch (format) {
        case 'zip':
          blob = await exportService.exportAsZip(tripId);
          filename = `trip-${tripId}-archive.zip`;
          break;
        case 'pdf':
          blob = await exportService.exportAsPDF(tripId);
          filename = `trip-${tripId}-photobook.pdf`;
          break;
        case 'gpx':
          const gpxContent = await exportService.exportAsGPX(tripId);
          blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
          filename = `trip-${tripId}-route.gpx`;
          break;
        case 'json':
          const jsonData = await exportService.exportAsJSON(tripId);
          blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          filename = `trip-${tripId}-backup.json`;
          break;
        default:
          throw new Error('Unknown export format');
      }
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      setError(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExportingData(null);
    }
  };

  const formatDuration = (days: number): string => {
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (weeks === 1 && remainingDays === 0) return '1 week';
    if (remainingDays === 0) return `${weeks} weeks`;
    return `${weeks}w ${remainingDays}d`;
  };

  const renderHighlight = (highlight: RecapHighlight, index: number) => (
    <div key={highlight.moment_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
      {highlight.media_url && (
        <div className="aspect-video bg-gray-100">
          {highlight.type === 'photo' && (
            <img 
              src={highlight.thumbnail_url || highlight.media_url}
              alt={highlight.title}
              className="w-full h-full object-cover"
            />
          )}
          {highlight.type === 'video' && (
            <video 
              src={highlight.media_url}
              className="w-full h-full object-cover"
              controls
            />
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">{highlight.emoji}</span>
          <span className="font-medium text-gray-900">{highlight.title}</span>
          <span className="text-sm text-gray-500">
            {highlight.timestamp.toLocaleDateString()}
          </span>
        </div>
        {highlight.description && (
          <p className="text-gray-700 text-sm mb-2">{highlight.description}</p>
        )}
        {highlight.location && (
          <p className="text-gray-500 text-xs">📍 {highlight.location}</p>
        )}
        {highlight.tags && highlight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {highlight.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderVisualElement = (element: VisualElement) => {
    switch (element.type) {
      case 'photo_collage':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{element.title}</h3>
            <div className="grid grid-cols-3 gap-2">
              {element.data.slice(0, 9).map((item: any, index: number) => (
                <img 
                  key={index}
                  src={item.thumbnail_url || item.media_url}
                  alt={`Highlight ${index + 1}`}
                  className="aspect-square object-cover rounded"
                />
              ))}
            </div>
          </div>
        );
      
      case 'statistics_chart':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{element.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{element.data.total_moments}</div>
                <div className="text-sm text-gray-600">Total Moments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{element.data.duration_days}</div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{element.data.cities_visited?.length || 0}</div>
                <div className="text-sm text-gray-600">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{element.data.countries_visited?.length || 0}</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your trip recap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Recap</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadRecap}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Recap Available</h2>
          <p className="text-gray-600 mb-6">Generate a recap to see your trip highlights and insights.</p>
          <button 
            onClick={generateNewRecap}
            disabled={generatingRecap}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
          >
            {generatingRecap ? 'Generating...' : 'Generate Recap'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{recap.summary.title}</h1>
              <p className="text-gray-600 mb-4">{recap.summary.subtitle}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>📅 {formatDuration(recap.summary.duration)}</span>
                <span>📍 {recap.summary.location_summary}</span>
                <span>🎯 {Math.round(recap.metadata.ai_confidence * 100)}% AI confidence</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={generateNewRecap}
                disabled={generatingRecap}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                {generatingRecap ? 'Generating...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* AI Narrative */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">✨ Your Journey Story</h2>
          <p className="text-gray-700 leading-relaxed text-lg">{recap.narrative}</p>
        </div>

        {/* Key Insights */}
        {recap.insights.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 Trip Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recap.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{insight.category}</span>
                    <span>{Math.round(insight.confidence * 100)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Elements */}
        {recap.visual_elements.map((element, index) => (
          <div key={index}>
            {renderVisualElement(element)}
          </div>
        ))}

        {/* Trip Highlights */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🌟 Trip Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recap.highlights.map((highlight, index) => renderHighlight(highlight, index))}
          </div>
        </div>

        {/* Recommendations */}
        {recap.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Recommendations</h2>
            <div className="space-y-3">
              {recap.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{rec.title}</h3>
                    <p className="text-gray-700 text-sm">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📥 Export Your Memories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => exportData('zip')}
              disabled={exportingData === 'zip'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📦</div>
              <span className="font-medium">ZIP Archive</span>
              <span className="text-xs text-gray-500 text-center">All photos & data</span>
            </button>
            
            <button
              onClick={() => exportData('pdf')}
              disabled={exportingData === 'pdf'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">📖</div>
              <span className="font-medium">PDF Book</span>
              <span className="text-xs text-gray-500 text-center">Photo book</span>
            </button>
            
            <button
              onClick={() => exportData('gpx')}
              disabled={exportingData === 'gpx'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">🗺️</div>
              <span className="font-medium">GPX Route</span>
              <span className="text-xs text-gray-500 text-center">GPS tracking</span>
            </button>
            
            <button
              onClick={() => exportData('json')}
              disabled={exportingData === 'json'}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="text-2xl mb-2">💾</div>
              <span className="font-medium">JSON Backup</span>
              <span className="text-xs text-gray-500 text-center">Full data export</span>
            </button>
          </div>
          
          {exportingData && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-blue-700">Preparing {exportingData.toUpperCase()} export...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
