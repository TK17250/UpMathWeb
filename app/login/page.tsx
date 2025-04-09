'use client'
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { getUser } from "../action/getuser"
import { useRouter } from "next/navigation"
import { login } from "../action/auth"
import Alert1, { AlertType } from "../component/alert1"

const Alert = {
  title: "",
  message: "",
  type: "",
}

export default function Login() {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [action, formAction] = useActionState(login, Alert)
  const router = useRouter()

  // Show alert when action is completed
  useEffect(() => {
      if (action && action.title && action.message && action.type && window.showAlert) {
          window.showAlert(action.title, action.message, action.type as AlertType);
      }

      // Redirect to home page if action is success
      if (action && action.type === "success") {
          router.push("/")
      }
  }, [action]);

  // Check login
  useEffect(() => {
    getUser().then((res: any) => {
      if (res) {
        router.push("/")
      }
    })
  }, [router])

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 h-screen overflow-hidden">
        {/* Alert */}
        <Alert1 />

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mb-6 text-center text-3xl/9 font-bold tracking-tight text-[#57CC99]">
            เข้าสู่ระบบ <span className="text-[#CCCCCC] text-lg">สำหรับคุณครู</span>
          </h2>
          <img
            alt="logo"
            src="./logo.png"
            className="mx-auto h-40 w-auto border-4 border-[#002D4A] rounded-4xl"
          />
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-[480px] p-8">
          <form action={formAction} className="space-y-6">
            {/* Email */}
            <div>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="อีเมล"
                  className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="รหัสผ่าน"
                  autoComplete="off"
                  className="block w-full rounded-md bg-[#203D4F] px-3 py-1.5 text-base text-white -outline-offset-1 border-2 outline-none border-[#002D4A] sm:text-sm/6 transition-all duration-300 placeholder:text-[#CCCCCC]"
                />

                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              {/* Submit */}
              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-[#203D4F] px-10 py-1.5 text-sm/6 text-[#80ED99] font-bold shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 border-[#002D4A]  border-2 hover:border-[#80ED99] transition-all duration-300"
                >
                  เข้าสู่ระบบ
                </button>
              </div>

              {/* Sign in */}
              <div className="text-sm/6">
                <Link href="/register" className="font-semibold text-white hover:text-[#CCCCCC] transition-all duration-300">
                  หากยังไม่มีบัญชี
                </Link>
              </div>
            </div>
          </form>

          {/* OAuth */}
          <div>
            {/* or */}
            <div className="flex items-center relative mt-6">
              <div className="w-full border-t text-[#CCCCCC]" />
              <span className="px-2 text-[#CCCCCC]">หรือ</span>
              <div className="w-full border-t text-[#CCCCCC]" />
            </div>

            {/* Google */}
            <a
              href="#"
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-100 transition-all focus-visible:ring-transparent mt-6"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              <span className="text-sm/6 font-bold">เข้าสู่ระบบด้วย Google</span>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}