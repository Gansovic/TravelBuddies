import type { TripStats } from '../types/trip';

/**
 * ExportService - Export moments and trip data in various formats
 * Following singleton pattern as per engineering principles
 * 
 * Supports export formats:
 * - ZIP archive with all media files
 * - PDF photo book with text
 * - GPX route file with location data
 * - JSON backup with all data
 * 
 * @example
 * ```typescript
 * const service = ExportService.getInstance();
 * const zipFile = await service.exportAsZip(tripId);
 * const gpxRoute = await service.exportAsGPX(tripId);
 * ```
 */
export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export trip as ZIP archive with all media files
   */
  async exportAsZip(tripId: string, options: ZipExportOptions = {}): Promise<Blob> {
    try {
      // Import JSZip dynamically to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Get all moments for the trip
      const moments = await this.getAllMoments(tripId);
      
      // Add metadata file
      const metadata = {
        trip_id: tripId,
        export_date: new Date().toISOString(),
        total_moments: moments.length,
        export_options: options,
        format_version: '1.0'
      };
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Add moments data
      const momentsData = moments.map((moment: any) => ({
        ...moment,
        // Convert dates to ISO strings for JSON serialization
        captured_at: moment.captured_at?.toISOString?.() || moment.captured_at,
        device_timestamp: moment.device_timestamp?.toISOString?.() || moment.device_timestamp,
        created_at: moment.created_at?.toISOString?.() || moment.created_at,
        updated_at: moment.updated_at?.toISOString?.() || moment.updated_at
      }));
      
      zip.file('moments.json', JSON.stringify(momentsData, null, 2));

      // Add media files organized by type and date
      for (const moment of moments) {
        if (moment.media_url) {
          try {
            const response = await fetch(moment.media_url);
            const blob = await response.blob();
            
            const date = (moment.captured_at?.toISOString?.() || moment.captured_at).split('T')[0];
            const extension = this.getFileExtension(moment.type, blob.type);
            const filename = `${date}/${moment.type}/${moment.id}.${extension}`;
            
            zip.file(filename, blob);
          } catch (error) {
            console.warn(`Failed to include media for moment ${moment.id}:`, error);
          }
        }
      }

      // Generate the ZIP file
      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      console.error('Export as ZIP failed:', error);
      throw new Error('Failed to create ZIP export');
    }
  }

  /**
   * Export as GPX route file with location data
   */
  async exportAsGPX(tripId: string): Promise<string> {
    try {
      const moments = await this.getAllMoments(tripId);
      
      // Filter moments with location data and sort by time
      const geoMoments = moments
        .filter((moment: any) => moment.latitude && moment.longitude)
        .sort((a: any, b: any) => {
          const aTime = new Date(a.captured_at).getTime();
          const bTime = new Date(b.captured_at).getTime();
          return aTime - bTime;
        });

      if (geoMoments.length === 0) {
        throw new Error('No location data available for GPX export');
      }

      // Generate GPX XML
      const gpxContent = this.generateGPX(geoMoments, tripId);
      return gpxContent;
    } catch (error) {
      console.error('GPX export failed:', error);
      throw new Error('Failed to create GPX export');
    }
  }

  /**
   * Export as PDF photo book
   */
  async exportAsPDF(tripId: string, options: PDFExportOptions = {}): Promise<Blob> {
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      const moments = await this.getAllMoments(tripId);
      const dayGroups = this.groupMomentsByDay(moments);

      // Cover page
      pdf.setFontSize(24);
      pdf.text('Travel Memories', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`${Object.keys(dayGroups).length} days of memories`, 20, 45);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 55);

      // Add pages for each day
      for (const [date, dayMoments] of Object.entries(dayGroups)) {
        pdf.addPage();

        // Day header
        pdf.setFontSize(18);
        pdf.text(this.formatDate(new Date(date)), 20, 20);
        
        pdf.setFontSize(10);
        pdf.text(`${(dayMoments as any[]).length} moments`, 20, 30);

        let yPosition = 45;

        // Add moments for this day
        for (const moment of (dayMoments as any[]).slice(0, 10)) {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          // Add moment info
          pdf.setFontSize(10);
          const capturedAt = new Date(moment.captured_at);
          pdf.text(`${capturedAt.toLocaleTimeString()} - ${moment.type}`, 20, yPosition);
          
          if (moment.title) {
            pdf.setFontSize(12);
            pdf.text(moment.title, 20, yPosition + 8);
            yPosition += 8;
          }
          
          if (moment.description) {
            pdf.setFontSize(9);
            const lines = pdf.splitTextToSize(moment.description, 170);
            pdf.text(lines, 20, yPosition + 8);
            yPosition += lines.length * 4;
          }

          if (moment.place_name) {
            pdf.setFontSize(8);
            pdf.text(`📍 ${moment.place_name}`, 20, yPosition + 8);
            yPosition += 6;
          }

          yPosition += 15;
        }
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to create PDF export');
    }
  }

  /**
   * Export complete data backup as JSON
   */
  async exportAsJSON(tripId: string): Promise<TripExportData> {
    try {
      const moments = await this.getAllMoments(tripId);
      const tripStats = await this.calculateTripStats(moments);

      const exportData: TripExportData = {
        trip_id: tripId,
        export_date: new Date().toISOString(),
        format_version: '1.0',
        moments: moments.map((moment: any) => ({
          ...moment,
          captured_at: moment.captured_at?.toISOString?.() || moment.captured_at,
          device_timestamp: moment.device_timestamp?.toISOString?.() || moment.device_timestamp,
          created_at: moment.created_at?.toISOString?.() || moment.created_at,
          updated_at: moment.updated_at?.toISOString?.() || moment.updated_at
        })),
        statistics: tripStats,
        metadata: {
          total_moments: moments.length,
          date_range: {
            start: moments.length > 0 ? Math.min(...moments.map((m: any) => new Date(m.captured_at).getTime())) : null,
            end: moments.length > 0 ? Math.max(...moments.map((m: any) => new Date(m.captured_at).getTime())) : null
          },
          locations_visited: Array.from(new Set(moments.map((m: any) => m.city).filter(Boolean))),
          moment_types: Array.from(new Set(moments.map((m: any) => m.type)))
        }
      };

      return exportData;
    } catch (error) {
      console.error('JSON export failed:', error);
      throw new Error('Failed to create JSON export');
    }
  }

  // Helper methods

  private async getAllMoments(tripId: string): Promise<any[]> {
    // TODO: Implement actual moment retrieval
    // This would use MomentService or direct Supabase queries
    return [];
  }

  private getFileExtension(momentType: string, mimeType: string): string {
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('wav')) return 'wav';
    
    // Fallback based on moment type
    switch (momentType) {
      case 'photo': return 'jpg';
      case 'video': return 'webm';
      case 'voice': return 'webm';
      default: return 'dat';
    }
  }

  private groupMomentsByDay(moments: any[]): Record<string, any[]> {
    return moments.reduce((groups, moment) => {
      const date = (moment.captured_at?.toISOString?.() || moment.captured_at).split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(moment);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private generateGPX(geoMoments: any[], tripId: string): string {
    const waypoints = geoMoments.map((moment: any) => `
    <wpt lat="${moment.latitude}" lon="${moment.longitude}">
      <time>${new Date(moment.captured_at).toISOString()}</time>
      <name>${moment.title || moment.type}</name>
      <desc>${moment.description || ''}</desc>
      <type>${moment.type}</type>
    </wpt>`).join('');

    const trackPoints = geoMoments.map((moment: any) => `
      <trkpt lat="${moment.latitude}" lon="${moment.longitude}">
        <time>${new Date(moment.captured_at).toISOString()}</time>
        <name>${moment.type}</name>
      </trkpt>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TravelBuddies" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trip ${tripId}</name>
    <desc>Travel route generated from TravelBuddies moments</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
  <trk>
    <name>Journey Route</name>
    <desc>Route traced from captured moments</desc>
    <trkseg>
      ${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
  }

  private async calculateTripStats(moments: any[]): Promise<TripStats> {
    const geoMoments = moments.filter((m: any) => m.latitude && m.longitude);
    
    return {
      duration_days: this.calculateDurationDays(moments),
      total_moments: moments.length,
      moments_by_type: moments.reduce((counts, moment) => {
        counts[moment.type] = (counts[moment.type] || 0) + 1;
        return counts;
      }, {} as Record<string, number>),
      total_distance_km: this.calculateTotalDistance(geoMoments),
      countries_visited: Array.from(new Set(moments.map((m: any) => m.country).filter(Boolean))),
      cities_visited: Array.from(new Set(moments.map((m: any) => m.city).filter(Boolean))),
      most_active_contributor: {
        user_id: 'unknown',
        user_name: 'Unknown',
        moment_count: moments.length
      },
      daily_averages: {
        moments_per_day: moments.length / Math.max(1, this.calculateDurationDays(moments))
      },
      peak_activity_day: {
        date: new Date().toISOString().split('T')[0],
        moment_count: 0
      }
    };
  }

  private calculateDurationDays(moments: any[]): number {
    if (moments.length === 0) return 0;
    
    const dates = moments.map((m: any) => (m.captured_at?.toISOString?.() || m.captured_at).split('T')[0]);
    const uniqueDates = Array.from(new Set(dates));
    return uniqueDates.length;
  }

  private calculateTotalDistance(geoMoments: any[]): number {
    if (geoMoments.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < geoMoments.length; i++) {
      const prev = geoMoments[i - 1];
      const curr = geoMoments[i];
      totalDistance += this.haversineDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
    return totalDistance;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Type definitions
export interface ZipExportOptions {
  includeMedia?: boolean;
  includeMetadata?: boolean;
  compression?: 'none' | 'fast' | 'best';
}

export interface PDFExportOptions {
  includeImages?: boolean;
  pageSize?: 'A4' | 'Letter' | 'A3';
  theme?: 'minimal' | 'classic' | 'modern';
}

export interface TripExportData {
  trip_id: string;
  export_date: string;
  format_version: string;
  moments: any[];
  statistics: TripStats;
  metadata: {
    total_moments: number;
    date_range: {
      start: number | null;
      end: number | null;
    };
    locations_visited: string[];
    moment_types: string[];
  };
}