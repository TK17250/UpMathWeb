'use client'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useState, useEffect, useRef, createContext, useContext } from 'react'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

// ------------- Alert Component -------------
interface AlertProps {
  id: string;
  title?: string;
  message?: string;
  type?: AlertType;
  onClose?: (id: string) => void;
}

function Alert({ id, title, message, type = 'info', onClose }: AlertProps) {
  const [isExiting, setIsExiting] = useState<boolean>(false)
  const alertRef = useRef<HTMLDivElement>(null)
  
  const handleDismiss = (): void => {
    setIsExiting(true)
    
    // รอให้ animation exit เสร็จก่อนเรียก onClose
    setTimeout(() => {
      if (onClose) {
        onClose(id)
      }
    }, 300)
  }
  
  // Determine the icon and colors based on alert type
  let IconComponent = InformationCircleIcon
  let bgColor = "bg-blue-50"
  let textColor = "text-blue-800"
  let iconColor = "text-blue-400"
  let hoverColor = "hover:bg-blue-100"
  let ringColor = "focus:ring-blue-600"
  let buttonColor = "text-blue-500"
  
  if (type === "success") {
    IconComponent = CheckCircleIcon
    bgColor = "bg-green-50"
    textColor = "text-green-800"
    iconColor = "text-green-400"
    hoverColor = "hover:bg-green-100"
    ringColor = "focus:ring-green-600"
    buttonColor = "text-green-500"
  } else if (type === "error") {
    IconComponent = XCircleIcon
    bgColor = "bg-red-50"
    textColor = "text-red-800"
    iconColor = "text-red-400"
    hoverColor = "hover:bg-red-100"
    ringColor = "focus:ring-red-600"
    buttonColor = "text-red-500"
  } else if (type === "warning") {
    IconComponent = ExclamationTriangleIcon
    bgColor = "bg-yellow-50"
    textColor = "text-yellow-800"
    iconColor = "text-yellow-400"
    hoverColor = "hover:bg-yellow-100"
    ringColor = "focus:ring-yellow-600"
    buttonColor = "text-yellow-500"
  }
  
  return (
    <div 
      ref={alertRef}
      className={`
        rounded-md ${bgColor} p-4 shadow-md z-50
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
        transform-gpu
      `}
      style={{ 
        transitionProperty: 'opacity, transform',
        animationName: 'slideDown',
        animationDuration: '300ms',
        animationTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex">
        <div className="shrink-0">
          <IconComponent className={`size-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          {title && <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>}
          {message && <div className={`text-sm ${textColor} mt-1`}>{message}</div>}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md ${bgColor} p-1.5 ${buttonColor} ${hoverColor} focus:ring-2 ${ringColor} focus:ring-offset-2 focus:outline-none`}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AlertInfo {
  id: string;
  title: string;
  message: string;
  type: AlertType;
}

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const AlertContext = createContext<{
  showAlert: (title: string, message: string, type?: AlertType) => void;
} | null>(null);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export default function Alert1() {
  // เก็บรายการ alerts ที่กำลังแสดงอยู่
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  
  // สร้างฟังก์ชันสำหรับเพิ่ม alert ใหม่
  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    // สร้าง ID ใหม่สำหรับ alert นี้
    const newAlert: AlertInfo = {
      id: generateUniqueId(),
      title,
      message,
      type
    }
    
    // แทนที่ alert เก่าด้วย alert ใหม่
    setAlerts([newAlert]);
  }
  
  // ฟังก์ชันสำหรับลบ alert
  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  }
  
  // Expose functions globally (for server action usage)
  useEffect(() => {
    // @ts-ignore - เพิ่ม function เข้าไปใน window object เพื่อให้เรียกใช้จากที่อื่นได้
    window.showAlert = showAlert;
    
    return () => {
      // @ts-ignore - ลบออกเมื่อ component unmount
      delete window.showAlert;
    }
  }, []);
  
  // ถ้าไม่มี alert ไม่ต้องแสดงอะไร
  if (alerts.length === 0) return null;
  
  return (
    <AlertContext.Provider value={{ showAlert }}>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            id={alert.id}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            onClose={removeAlert}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
}

declare global {
  interface Window {
    showAlert?: (title: string, message: string, type: AlertType) => void;
  }
}