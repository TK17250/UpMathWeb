'use server'

// Login
// async function login(formData: FormData) {
//     "use server"
//     const email = formData.get("email")
//     const password = formData.get("password")

//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//             email,
//             password,
//         }),
//     })

//     if (!res.ok) {
//         throw new Error("Login failed")
//     }

//     return res.json()
// }


// Register
async function register(prevState: any, formData: FormData): Promise<any> {
    try {
        const fullname = formData.get("fullname") as string
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const gender = formData.get("gender") as string
        const age = formData.get("age") as string
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmpassword") as string

        // Check empty
        if (!fullname || !name || !email || !gender || !age || !password || !confirmPassword) {
            return {
                title: "กรุณากรอกข้อมูลให้ครบ",
                message: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
                type: "warning",
            }
        }

        // Check password
        if (password !== confirmPassword) {
            return {
                title: "รหัสผ่านไม่ตรงกัน",
                message: "กรุณากรอกรหัสผ่านให้ตรงกัน",
                type: "warning",
            }
        }

        // Check email

        return {
            title: "กำลังสร้างบัญชี",
            message: "กรุณารอสักครู่",
            type: "info",
        }
    } catch (error) {
        console.log(error)
    }
}

export {
    register,
}