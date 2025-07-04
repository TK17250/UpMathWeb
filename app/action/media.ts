'use server'
import { createSupabaseServerClient } from "@/server/server";
import { getUserData } from "./getuser";
import { translateServerSupabaseErrorToThai } from "@/server/error";

// Function to create new media
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
            
        // If a record is found, it's a duplicate
        if (mediaNameData) {
            return { title: "เกิดข้อผิดพลาด", message: "คุณมีสื่อการสอนชื่อนี้อยู่แล้ว", type: "error" };
        }

        // A PostgREST error code 'PGRST116' means no rows were found, which is what we want. Any other error is a real problem.
        if (mediaNameError && mediaNameError.code !== 'PGRST116') {
            return { title: "เกิดข้อผิดพลาด", message: mediaNameError.message, type: "error" };
        }

        // ------------------------------------ Manage ------------------------------------

        // Rename file;
        const fileExtension = media.name.split('.').pop();
        const fileNameNew = `${userData.t_id}/${Date.now()}.${fileExtension}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
            .from("medias")
            .upload(fileNameNew, media);
        if (uploadError) return { title: "เกิดข้อผิดพลาด", message: uploadError.message, type: "error" };

        // Insert media data to database
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
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: mediaError.message, type: "error" };

        return { title: "สำเร็จ", message: "อัพโหลดสื่อเรียบร้อยแล้ว", type: "success" };
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Function to read media for the current user
async function getMedia() {
    try {
        const supabase = await createSupabaseServerClient(); // Call Supabase
        const userData = await getUserData();
        if (!userData) return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };

        // Get media data
        const { data: mediaData, error: mediaError } = await supabase
            .from("medias")
            .select("*")
            .eq("m_tid", userData.t_id) // Use t_id for better indexing
            .order("m_id", { ascending: false });
        if (mediaError) return { title: "เกิดข้อผิดพลาด", message: mediaError.message, type: "error" };

        return mediaData;
    } catch (error: any) {
        console.log("Server error: ", error.message);
        return { title: "เกิดข้อผิดพลาดฝั่งเซิฟเวอร์", message: error.message, type: "error" };
    }
}

// Function to get media data and their signed URLs for display
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
                    .createSignedUrl(filePath, 3600); // URL valid for 1 hour

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

// Function to update existing media
async function updateMedia(prevState: any, formData: FormData) {
    try {
        const supabase = await createSupabaseServerClient();
        const mediaId = formData.get("m_id");
        const name = formData.get("m_name") as string;
        const description = formData.get("m_media_content") as string;
        const newMediaFile = formData.get("m_media") as File | null;
        const newPeriod = formData.get("m_period") as string;

        // ------------------------------------ Check State ------------------------------------
        if (!mediaId || !name || !description) {
            return { title: "เกิดข้อผิดพลาด", message: "ข้อมูลไม่ครบถ้วน", type: "error" };
        }

        const userData = await getUserData();
        if (!userData) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่พบข้อมูลผู้ใช้", type: "error" };
        }

        // Check if the new name is a duplicate, excluding the current item
        const { data: duplicateData, error: duplicateError } = await supabase
            .from("medias")
            .select("m_id")
            .eq("m_name", name)
            .eq("m_tid", userData.t_id)
            .neq("m_id", mediaId) // Important: Exclude the current media from the check
            .single();

        if (duplicateData) {
            return { title: "ชื่อซ้ำ", message: "คุณมีสื่อการสอนชื่อนี้อยู่แล้ว", type: "error" };
        }
        if (duplicateError && duplicateError.code !== 'PGRST116') {
             return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(duplicateError), type: "error" };
        }

        // ------------------------------------ Manage State ------------------------------------
        const { data: existingMedia, error: existingMediaError } = await supabase
            .from("medias")
            .select("m_media")
            .eq("m_id", mediaId)
            .single();
        
        if (existingMediaError || !existingMedia) {
            return { title: "เกิดข้อผิดพลาด", message: "ไม่สามารถดึงข้อมูลไฟล์เดิมได้", type: "error" };
        }

        const updatePayload: any = {
            m_name: name,
            m_media: {
                ...existingMedia.m_media, // Preserve existing data
                description: description
            }
        };

        // If a new file is uploaded, handle file replacement
        if (newMediaFile && newMediaFile.size > 0) {
            const oldFilePath = existingMedia.m_media?.file_name;

            // 1. Upload the new file
            const fileExtension = newMediaFile.name.split('.').pop();
            const newFileName = `${userData.t_id}/${Date.now()}.${fileExtension}`;
            const { error: uploadError } = await supabase.storage
                .from("medias")
                .upload(newFileName, newMediaFile);

            if (uploadError) {
                return { title: "เกิดข้อผิดพลาด", message: await translateServerSupabaseErrorToThai(uploadError), type: "error" };
            }

            // 2. Update payload with new file info
            updatePayload.m_media.file_name = newFileName;
            updatePayload.m_period = newPeriod;

            // 3. Delete the old file from storage (after new one is successfully uploaded)
            if (oldFilePath) {
                const { error: deleteError } = await supabase.storage
                    .from("medias")
                    .remove([oldFilePath]);

                if (deleteError) {
                    console.warn("Failed to delete old media file:", deleteError.message);
                }
            }
        }

        // Perform the final update
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

export {
    createMedia,
    getMedia,
    getMediaWithSignedUrls,
    updateMedia
}