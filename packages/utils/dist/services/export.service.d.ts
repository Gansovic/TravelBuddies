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
export declare class ExportService {
    private static instance;
    private constructor();
    static getInstance(): ExportService;
    /**
     * Export trip as ZIP archive with all media files
     */
    exportAsZip(tripId: string, options?: ZipExportOptions): Promise<Blob>;
    /**
     * Export as GPX route file with location data
     */
    exportAsGPX(tripId: string): Promise<string>;
    /**
     * Export as PDF photo book
     */
    exportAsPDF(tripId: string, options?: PDFExportOptions): Promise<Blob>;
    /**
     * Export complete data backup as JSON
     */
    exportAsJSON(tripId: string): Promise<TripExportData>;
    private getAllMoments;
    private getFileExtension;
    private groupMomentsByDay;
    private formatDate;
    private generateGPX;
    private calculateTripStats;
    private calculateDurationDays;
    private calculateTotalDistance;
    private haversineDistance;
    private toRadians;
}
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
