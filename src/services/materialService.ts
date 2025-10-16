import { supabase } from '../supabaseClient';

export interface Material {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: 'video' | 'pdf' | 'image' | 'document' | 'audio' | 'other';
  file_extension: string;
  file_size_bytes: number;
  file_path: string;
  bucket_name: string;
  download_url?: string;
  thumbnail_url?: string;
  subject_id: string;
  grade_level?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  tags: string[];
  is_public: boolean;
  is_featured: boolean;
  download_count: number;
  view_count: number;
  rating_average: number;
  rating_count: number;
  metadata: Record<string, any>;
  status: 'active' | 'archived' | 'pending_review' | 'rejected';
  created_at: string;
  updated_at: string;
  // Joined data
  subject_name?: string;
  teacher_name?: string;
  categories?: MaterialCategory[];
}

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  parent_category_id?: string;
  is_active: boolean;
}

export interface MaterialRating {
  id: string;
  material_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
  user_name?: string;
}

export interface MaterialCollection {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  materials?: Material[];
  material_count?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// File type configurations
const FILE_TYPE_CONFIG = {
  video: {
    bucket: 'materials-videos',
    maxSize: 524288000, // 500MB
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'],
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
  },
  pdf: {
    bucket: 'materials-pdfs',
    maxSize: 52428800, // 50MB
    allowedTypes: ['application/pdf'],
    extensions: ['.pdf']
  },
  image: {
    bucket: 'materials-images',
    maxSize: 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp']
  },
  document: {
    bucket: 'materials-other',
    maxSize: 104857600, // 100MB
    allowedTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    extensions: ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']
  },
  audio: {
    bucket: 'materials-other',
    maxSize: 104857600, // 100MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    extensions: ['.mp3', '.wav', '.ogg', '.m4a']
  },
  other: {
    bucket: 'materials-other',
    maxSize: 104857600, // 100MB
    allowedTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'text/plain'],
    extensions: ['.zip', '.rar', '.7z', '.txt', '.rtf']
  }
};

export class MaterialService {
  /**
   * Determine file type based on file extension and MIME type
   */
  static determineFileType(file: File): keyof typeof FILE_TYPE_CONFIG | null {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
      if (config.extensions.includes(extension) || config.allowedTypes.includes(mimeType)) {
        return type as keyof typeof FILE_TYPE_CONFIG;
      }
    }

    return null;
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const fileType = this.determineFileType(file);
    
    if (!fileType) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload videos, PDFs, images, documents, or audio files.'
      };
    }

    const config = FILE_TYPE_CONFIG[fileType];
    
    if (file.size > config.maxSize) {
      const maxSizeMB = Math.round(config.maxSize / 1024 / 1024);
      return {
        isValid: false,
        error: `File size too large. Maximum size for ${fileType} files is ${maxSizeMB}MB.`
      };
    }

    return { isValid: true };
  }

  /**
   * Generate file path for storage
   */
  static generateFilePath(teacherId: string, fileName: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Clean filename (remove special characters)
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${teacherId}/${year}/${month}/${day}/${cleanFileName}`;
  }

  /**
   * Upload file to Supabase storage
   */
  static async uploadFile(
    file: File,
    teacherId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ filePath: string; bucketName: string; downloadUrl: string }> {
    const fileType = this.determineFileType(file);
    if (!fileType) {
      throw new Error('Unsupported file type');
    }

    const config = FILE_TYPE_CONFIG[fileType];
    const filePath = this.generateFilePath(teacherId, file.name);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(filePath);

    return {
      filePath,
      bucketName: config.bucket,
      downloadUrl: urlData.publicUrl
    };
  }

  /**
   * Create material record in database
   */
  static async createMaterial(materialData: {
    teacher_id: string;
    title: string;
    description?: string;
    file_name: string;
    file_type: string;
    file_extension: string;
    file_size_bytes: number;
    file_path: string;
    bucket_name: string;
    download_url: string;
    subject_id: string;
    grade_level?: string;
    difficulty_level?: string;
    tags?: string[];
    is_public?: boolean;
    metadata?: Record<string, any>;
  }): Promise<Material> {
    const { data, error } = await supabase
      .from('materials_library')
      .insert([materialData])
      .select(`
        *,
        subjects(id, name),
        teachers(id, profiles(id, full_name))
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create material: ${error.message}`);
    }

    return {
      ...data,
      subject_name: data.subjects?.name,
      teacher_name: data.teachers?.profiles?.full_name
    };
  }

  /**
   * Upload material with file
   */
  static async uploadMaterial(
    file: File,
    materialData: {
      title: string;
      description?: string;
      subject_id: string;
      grade_level?: string;
      difficulty_level?: string;
      tags?: string[];
      is_public?: boolean;
      metadata?: Record<string, any>;
    },
    teacherId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Material> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Upload file
    const uploadResult = await this.uploadFile(file, teacherId, onProgress);

    // Create material record
    const materialRecord = await this.createMaterial({
      teacher_id: teacherId,
      title: materialData.title,
      description: materialData.description,
      file_name: file.name,
      file_type: this.determineFileType(file)!,
      file_extension: '.' + file.name.split('.').pop()?.toLowerCase(),
      file_size_bytes: file.size,
      file_path: uploadResult.filePath,
      bucket_name: uploadResult.bucketName,
      download_url: uploadResult.downloadUrl,
      subject_id: materialData.subject_id,
      grade_level: materialData.grade_level,
      difficulty_level: materialData.difficulty_level || 'medium',
      tags: materialData.tags || [],
      is_public: materialData.is_public || false,
      metadata: materialData.metadata || {}
    });

    return materialRecord;
  }

  /**
   * Get materials for a teacher
   */
  static async getTeacherMaterials(
    teacherId: string,
    options: {
      limit?: number;
      offset?: number;
      fileType?: string;
      subjectId?: string;
      status?: string;
      search?: string;
    } = {}
  ): Promise<{ materials: Material[]; total: number }> {
    let query = supabase
      .from('materials_library')
      .select(`
        *,
        subjects(id, name),
        teachers(id, profiles(id, full_name)),
        material_category_assignments(
          material_categories(id, name, description)
        )
      `, { count: 'exact' })
      .eq('teacher_id', teacherId);

    // Apply filters
    if (options.fileType) {
      query = query.eq('file_type', options.fileType);
    }
    if (options.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch materials: ${error.message}`);
    }

    const materials = data?.map(item => ({
      ...item,
      subject_name: item.subjects?.name,
      teacher_name: item.teachers?.profiles?.full_name,
      categories: item.material_category_assignments?.map((ca: any) => ca.material_categories)
    })) || [];

    return {
      materials,
      total: count || 0
    };
  }

  /**
   * Get public materials (for browsing)
   */
  static async getPublicMaterials(options: {
    limit?: number;
    offset?: number;
    fileType?: string;
    subjectId?: string;
    search?: string;
    sortBy?: 'rating' | 'downloads' | 'created_at';
  } = {}): Promise<{ materials: Material[]; total: number }> {
    let query = supabase
      .from('materials_library')
      .select(`
        *,
        subjects(id, name),
        teachers(id, profiles(id, full_name)),
        material_category_assignments(
          material_categories(id, name, description)
        )
      `, { count: 'exact' })
      .eq('is_public', true)
      .eq('status', 'active');

    // Apply filters
    if (options.fileType) {
      query = query.eq('file_type', options.fileType);
    }
    if (options.subjectId) {
      query = query.eq('subject_id', options.subjectId);
    }
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const ascending = sortBy === 'created_at' ? false : true;
    query = query.order(sortBy, { ascending });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch public materials: ${error.message}`);
    }

    const materials = data?.map(item => ({
      ...item,
      subject_name: item.subjects?.name,
      teacher_name: item.teachers?.profiles?.full_name,
      categories: item.material_category_assignments?.map((ca: any) => ca.material_categories)
    })) || [];

    return {
      materials,
      total: count || 0
    };
  }

  /**
   * Get material by ID
   */
  static async getMaterial(materialId: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials_library')
      .select(`
        *,
        subjects(id, name),
        teachers(id, profiles(id, full_name)),
        material_category_assignments(
          material_categories(id, name, description)
        )
      `)
      .eq('id', materialId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch material: ${error.message}`);
    }

    return {
      ...data,
      subject_name: data.subjects?.name,
      teacher_name: data.teachers?.profiles?.full_name,
      categories: data.material_category_assignments?.map((ca: any) => ca.material_categories)
    };
  }

  /**
   * Update material
   */
  static async updateMaterial(
    materialId: string,
    updates: Partial<{
      title: string;
      description: string;
      grade_level: string;
      difficulty_level: string;
      tags: string[];
      is_public: boolean;
      is_featured: boolean;
      metadata: Record<string, any>;
      status: string;
    }>
  ): Promise<Material> {
    const { data, error } = await supabase
      .from('materials_library')
      .update(updates)
      .eq('id', materialId)
      .select(`
        *,
        subjects(id, name),
        teachers(id, profiles(id, full_name))
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update material: ${error.message}`);
    }

    return {
      ...data,
      subject_name: data.subjects?.name,
      teacher_name: data.teachers?.profiles?.full_name
    };
  }

  /**
   * Delete material
   */
  static async deleteMaterial(materialId: string): Promise<void> {
    // Get material info first
    const material = await this.getMaterial(materialId);
    if (!material) {
      throw new Error('Material not found');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(material.bucket_name)
      .remove([material.file_path]);

    if (storageError) {
      console.warn(`Failed to delete file from storage: ${storageError.message}`);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('materials_library')
      .delete()
      .eq('id', materialId);

    if (dbError) {
      throw new Error(`Failed to delete material: ${dbError.message}`);
    }
  }

  /**
   * Record material usage (download, view, etc.)
   */
  static async recordUsage(
    materialId: string,
    userId: string,
    usageType: 'download' | 'view' | 'assign' | 'share',
    classId?: string,
    sessionId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('material_usage')
      .insert({
        material_id: materialId,
        user_id: userId,
        usage_type: usageType,
        class_id: classId,
        session_id: sessionId
      });

    if (error) {
      console.warn(`Failed to record usage: ${error.message}`);
    }
  }

  /**
   * Rate material
   */
  static async rateMaterial(
    materialId: string,
    userId: string,
    rating: number,
    review?: string
  ): Promise<MaterialRating> {
    const { data, error } = await supabase
      .from('material_ratings')
      .upsert({
        material_id: materialId,
        user_id: userId,
        rating,
        review
      })
      .select(`
        *,
        profiles(id, full_name)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to rate material: ${error.message}`);
    }

    return {
      ...data,
      user_name: data.profiles?.full_name
    };
  }

  /**
   * Get material ratings
   */
  static async getMaterialRatings(materialId: string): Promise<MaterialRating[]> {
    const { data, error } = await supabase
      .from('material_ratings')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('material_id', materialId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    return data?.map(rating => ({
      ...rating,
      user_name: rating.profiles?.full_name
    })) || [];
  }

  /**
   * Get material categories
   */
  static async getCategories(): Promise<MaterialCategory[]> {
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Assign material to categories
   */
  static async assignToCategories(
    materialId: string,
    categoryIds: string[]
  ): Promise<void> {
    // Remove existing assignments
    await supabase
      .from('material_category_assignments')
      .delete()
      .eq('material_id', materialId);

    // Add new assignments
    if (categoryIds.length > 0) {
      const assignments = categoryIds.map(categoryId => ({
        material_id: materialId,
        category_id: categoryId
      }));

      const { error } = await supabase
        .from('material_category_assignments')
        .insert(assignments);

      if (error) {
        throw new Error(`Failed to assign categories: ${error.message}`);
      }
    }
  }
}





