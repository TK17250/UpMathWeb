"use server"

import { createSupabaseServerClient } from "@/server/server";

async function getStudentID(studentId: string) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("s_id", studentId)
            .single();

        if (error) {
            throw new Error(`Error fetching student ID: ${error.message}`);
        }

        if (!data) {
            throw new Error("Student not found");
        }

        console.log("Fetched Student ID:", data);

        return data;
    } catch (e: any) {
        console.error("Error fetching student ID:", e);
        return { type: "error", message: e.message };
    }
}

export {
    getStudentID,
}