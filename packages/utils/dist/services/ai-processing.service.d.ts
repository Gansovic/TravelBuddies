/**
 * AIProcessingService - Intelligent moment enhancement and analysis
 * Following singleton pattern as per engineering principles
 *
 * Handles AI-powered features for memory recording:
 * - Photo and video enhancement
 * - Voice note transcription
 * - Content analysis and categorization
 * - Caption generation
 * - Object and scene recognition
 *
 * @example
 * ```typescript
 * const service = AIProcessingService.getInstance();
 * const enhanced = await service.enhancePhoto(imageBlob);
 * const transcription = await service.transcribeAudio(audioBlob);
 * const analysis = await service.analyzeContent(momentData);
 * ```
 */
export declare class AIProcessingService {
    private static instance;
    private processingQueue;
    private constructor();
    static getInstance(): AIProcessingService;
    /**
     * Process a moment with AI enhancements
     */
    processMoment(momentId: string, momentData: any): Promise<ProcessingResult>;
    /**
     * Process photo moments
     */
    private processPhoto;
    /**
     * Process video moments
     */
    private processVideo;
    /**
     * Process audio/voice moments
     */
    private processAudio;
    /**
     * Process text moments
     */
    private processText;
    /**
     * Process check-in moments
     */
    private processCheckin;
    /**
     * General content analysis for all moment types
     */
    private analyzeContent;
    private enhancePhoto;
    private transcribeAudio;
    private detectObjects;
    private recognizeScene;
    private analyzePhotoQuality;
    private stabilizeVideo;
    private generateVideoThumbnail;
    private analyzeVideoScenes;
    private extractVideoAudio;
    private reduceNoise;
    private detectSpeakers;
    private analyzeSentiment;
    private detectLanguage;
    private extractEntities;
    private classifyTopics;
    private getPlaceDetails;
    private getPopularTimes;
    private findSimilarPlaces;
    private summarizeReviews;
    private generateCaption;
    private suggestTags;
    private suggestEmoji;
    private categorizeContent;
    /**
     * Get processing status for a moment
     */
    getProcessingStatus(momentId: string): ProcessingJob | null;
    /**
     * Cancel processing for a moment
     */
    cancelProcessing(momentId: string): boolean;
    /**
     * Get all active processing jobs
     */
    getActiveJobs(): ProcessingJob[];
    private delay;
}
export interface ProcessingJob {
    id: string;
    type: string;
    status: 'processing' | 'completed' | 'failed' | 'cancelled';
    started_at: Date;
    completed_at?: Date;
    error?: string;
    tasks: ProcessingTask[];
}
export interface ProcessingTask {
    name: string;
    status: 'processing' | 'completed' | 'failed';
    started_at: Date;
    completed_at?: Date;
    error?: string;
}
export interface ProcessingResult {
    moment_id: string;
    original_data: any;
    enhancements: {
        enhanced_photo?: string;
        stabilized_video?: string;
        thumbnail?: string;
        transcription?: string;
        clean_audio?: string;
        ai_caption?: string;
    };
    metadata: {
        detected_objects?: string[];
        scene_type?: string;
        quality_score?: number;
        video_scenes?: string[];
        extracted_audio?: string;
        speaker_count?: number;
        sentiment?: {
            sentiment: string;
            score: number;
        };
        language?: string;
        entities?: Array<{
            entity: string;
            type: string;
        }>;
        topics?: string[];
        place_details?: any;
        popular_times?: any;
        similar_places?: string[];
        reviews_summary?: string;
        suggested_tags?: string[];
        suggested_emoji?: string[];
        ai_category?: string;
    };
    confidence_scores: {
        transcription?: number;
        object_detection?: number;
        scene_recognition?: number;
    };
    error?: string;
}
