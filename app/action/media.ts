// app/action/media.ts

'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";
import { translateServerSupabaseErrorToThai } from "@/server/error";

// Create media
async function createMedia(prevState: any, formData: any) {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const name = formData.get("m_name");
        const media = formData.get("m_media");
        const period = formData.get("m_period");
        const description = formData.get("m_media_content");

        // ------------------------------------ Check State ------------------------------------

        // Check empty
        if (!name || !media || !period || !description) {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณากรอกข้อมูลให้ครบถ้วน", type: "error" };
        }

        // Check file type
        const fileType = media.type.split("/")[0];
        if (fileType !== "image" && fileType !== "video") {
            return { title: "เกิดข้อผิดพลาด", message: "กรุณาอัพโหลดไฟล์รูปภาพหรือวิดีโอเท่านั้น", type: "error" };
        }

        // Check file size max 50MB
        const fileSize = media.size / 1024 / 1024;
        if (fileSize > 50) {
            return { title: "เกิดข้อผิดพลาด", message: "ขนาดไฟล์ต้องไม่เกิน 50MB", type: "error" };
        }

        // Get teacher data
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Check media name from database for the current user
        const { data: mediaNameData, error: mediaNameError } = await supabase
            .from("medias")
            .select("m_name")
            .eq("m_name", name)
            .eq("m_tid", userData.t_id) // Check only for the current user's media
            .single();
            
        if (mediaNameData) {
            return { title: "เกิดข้อผิดพลาด", message: "คุณมีสื่อการสอนชื่อนี้อยู่แล้ว", type: "error" };
        }

        if (mediaNameError && mediaNameError.code !== 'PGRST116') {
            return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(mediaNameError), type: "error" };
        }

        // ------------------------------------ Manage ------------------------------------

        const fileExtension = media.name.split('.').pop();
        const fileNameNew = `${userData.t_id}/${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
            .from("medias")
            .upload(fileNameNew, media);
        if (uploadError) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(uploadError), type: "error" };

        const { error: mediaError } = await supabase
            .from("medias")
            .insert({
                m_name: name,
                m_tid: userData.t_id,
                m_temail: userData.t_email,
                m_period: period,
                m_media: {
                    file_name: fileNameNew,
                    description: description,
                },
            })
            .select()
            .single();
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(mediaError), type: "error" };

        return { title: "สำเร็จ", message: "อัพโหลดสื่อเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Read media
async function getMedia() {
    try {
        const supabase = await createSupabaseServerClient();
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        const { data: mediaData, error: mediaError } = await supabase
            .from("medias")
            .select("*")
            .eq("m_tid", userData.t_id)
            .order("m_id", { ascending: false });
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(mediaError), type: "error" };

        return mediaData;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Get media data and their signed URLs for display
async function getMediaWithSignedUrls() {
    try {
        const mediaDataResult = await getMedia();
        if (!Array.isArray(mediaDataResult)) {
            return mediaDataResult;
        }

        const supabase = await createSupabaseServerClient();

        const mediaWithUrls = await Promise.all(
            mediaDataResult.map(async (media) => {
                const filePath = media.m_media?.file_name;
                if (!filePath) {
                    return { ...media, signedUrl: null, fileType: 'unknown' };
                }

                const { data, error } = await supabase.storage
                    .from('medias')
                    .createSignedUrl(filePath, 3600);

                if (error) {
                    console.error("Error creating signed URL for", filePath, error.message);
                    return { ...media, signedUrl: null, fileType: 'unknown' };
                }
                
                const extension = filePath.split('.').pop()?.toLowerCase() || '';
                let fileType: 'image' | 'video' | 'unknown' = 'unknown';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    fileType = 'image';
                } else if (['mp4', 'mov', 'webm', 'ogv'].includes(extension)) {
                    fileType = 'video';
                }

                return { ...media, signedUrl: data.signedUrl, fileType };
            })
        );
        
        return mediaWithUrls;
    } catch (error: any) {
        console.log("Error getting media with URLs:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Update media
async function updateMedia(prevState: any, formData: FormData) {
    try {
        const supabase = await createSupabaseServerClient();
        const mediaId = formData.get("m_id");
        const name = formData.get("m_name") as string;
        const description = formData.get("m_media_content") as string;
        const newMediaFile = formData.get("m_media") as File | null;
        const newPeriod = formData.get("m_period") as string;

        if (!mediaId || !name || !description) {
            return { title: "เกิดข้อผิดพลาด", message: "ข้อมูลไม่ครบถ้วน", type: "error" };
        }

        const userData = await getUserData();
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        const { data: duplicateData, error: duplicateError } = await supabase
            .from("medias")
            .select("m_id")
            .eq("m_name", name)
            .eq("m_tid", userData.t_id)
            .neq("m_id", mediaId)
            .single();

        if (duplicateData) {
            return { title: "ชื่อซ้ำ", message: "คุณมีสื่อการสอนชื่อนี้อยู่แล้ว", type: "error" };
        }
        if (duplicateError && duplicateError.code !== 'PGRST116') {
             return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(duplicateError), type: "error" };
        }

        const { data: existingMedia, error: existingMediaError } = await supabase
            .from("medias")
            .select("m_media")
            .eq("m_id", mediaId)
            .single();

        if (existingMediaError || !existingMedia) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่สามารถดึงข้อมูลสื่อเดิมได้", type: "error" };
        }

        const updatePayload: any = {
            m_name: name,
            m_media: { 
                ...existingMedia.m_media,
                description: description 
            }
        };

        if (newMediaFile && newMediaFile.size > 0) {
            const oldFilePath = existingMedia.m_media.file_name;
            
            const fileExtension = newMediaFile.name.split('.').pop();
            const newFileName = `${userData.t_id}/${Date.now()}.${fileExtension}`;
            const { error: uploadError } = await supabase.storage
                .from("medias")
                .upload(newFileName, newMediaFile);

            if (uploadError) {
                return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(uploadError), type: "error" };
            }

            updatePayload.m_media.file_name = newFileName;
            updatePayload.m_period = newPeriod;

            if (oldFilePath) {
                const { error: deleteError } = await supabase.storage
                    .from("medias")
                    .remove([oldFilePath]);

                if (deleteError) {
                    console.warn("Failed to delete old media file:", deleteError.message);
                }
            }
        }

        const { error: updateError } = await supabase
            .from("medias")
            .update(updatePayload)
            .eq("m_id", mediaId);
            
        if (updateError) {
            return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(updateError), type: "error" };
        }

        return { title: "สำเร็จ", message: "แก้ไขสื่อการสอนเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error during update:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// ** NEW FUNCTION **
// Delete media
async function deleteMedia(prevState: any, formData: FormData) {
    try {
        const supabase = await createSupabaseServerClient();
        const mediaId = formData.get("m_id");

        if (!mediaId) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบรหัสของสื่อ", type: "error" };
        }
        
        const userData = await getUserData();
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // 1. Verify ownership and get file path
        const { data: mediaToDelete, error: fetchError } = await supabase
            .from("medias")
            .select("m_media->>file_name, m_tid")
            .eq("m_id", mediaId)
            .single();

        if (fetchError || !mediaToDelete) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบสื่อที่ต้องการลบ", type: "error" };
        }

        // Security Check: Ensure the media belongs to the current user
        if (mediaToDelete.m_tid !== userData.t_id) {
            return { title: "ไม่มีสิทธิ์", message: "คุณไม่มีสิทธิ์ลบสื่อนี้", type: "error" };
        }

        // 2. Delete the database record first
        const { error: deleteDbError } = await supabase
            .from("medias")
            .delete()
            .eq("m_id", mediaId);

        if (deleteDbError) {
            return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(deleteDbError), type: "error" };
        }

        // 3. Delete the file from storage
        const filePath = mediaToDelete.file_name;
        if (filePath) {
            const { error: deleteStorageError } = await supabase.storage
                .from("medias")
                .remove([filePath]);
            
            if (deleteStorageError) {
                // Log a warning but don't fail the whole operation, as the DB record is already gone.
                console.warn(`Failed to delete file ${filePath} from storage:`, deleteStorageError.message);
                return { title: "ลบสำเร็จบางส่วน", message: "ลบข้อมูลสื่อสำเร็จ แต่เกิดปัญหาในการลบไฟล์ออกจากที่จัดเก็บ", type: "warning" };
            }
        }
        
        return { title: "สำเร็จ", message: "ลบสื่อการสอนเรียบร้อยแล้ว", type: "success" };

    } catch (error: any) {
        console.error("Error deleting media:", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}


export {
    createMedia,
    getMedia,
    getMediaWithSignedUrls,
    updateMedia,
    deleteMedia, // Export the new function
}