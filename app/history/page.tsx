'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "../action/getuser";
import { getActivities } from "../action/history";
import Navbar from "../component/navbar";
import Sidebar from "../component/sidebar";
import Footer from "../component/footer";

// Function to format date and time
function formatDateTime(dateString: string) {
  if (!dateString) return { date: 'ไม่ระบุ', time: 'ไม่ระบุ' };
  
  const date = new Date(dateString);
  
  // Format date as DD/MM/YYYY
  const formattedDate = date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Format time as HH:MM
  const formattedTime = date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    date: formattedDate,
    time: formattedTime
  };
}

export default function History() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [student_data, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check login
  const router = useRouter();
  useEffect(() => {
    getUser().then((res: any) => {
      if (!res) {
        router.push("/login")
      }
    })
  }, [router])

  // Get user
  useEffect(() => {
    getUser().then((res: any) => {
      if (res) {
        setUser(res);
      }
    })
  }, [])

  // Get activities data
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const activitiesRes = await getActivities();
        
        console.log("Activities response:", activitiesRes);
        
        if (activitiesRes?.type === 'success') {
          console.log("Activities data length:", activitiesRes.data?.length);
          console.log("Activities data:", activitiesRes.data);
          setActivities(activitiesRes.data || []);
        } else {
          console.error("Activities fetch error:", activitiesRes);
          setActivities([]); // Set empty array on error
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log("User data:", user);
      fetchActivities();
    }
  }, [user]);



  // Get student data
  useEffect(() => {
    if (activities.length > 0) {
    //   const studentIds = activities.map(activity => activity.a_sid).filter(Boolean);
    //   if (studentIds.length > 0) {
    //     fetch(`/api/student?ids=${studentIds.join(',')}`)
    //       .then(res => res.json())
    //       .then(data => {
    //         setStudentData(data);
    //       })
    //       .catch(err => console.error('Error fetching student data:', err));
    //   }
    }
    console.log("Activities data:", activities);
  }, [activities]);

  return (
    <div className="overflow-hidden h-screen">
      {user && (
        <div className="h-full w-11/12 justify-center m-auto flex flex-col">
          {/* Navbar */}
          <Navbar />

          <div className="flex flex-col lg:flex-row h-full lg:h-auto">
            {/* Sidebar */}
            <Sidebar />

            {/* Content */}
            <div className="bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 rounded-xl w-full h-full lg:h-auto border-4 border-[#203D4F] p-5 overflow-y-auto">
              
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#80ED99]"></div>
                </div>
              ) : (
                <>
                  {/* Activities List */}
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <div key={index} className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B] hover:border-[#80ED99] transition-all duration-300 cursor-pointer">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-white font-semibold text-lg">{activity.homework_name || `ชุดฝึก ${activity.a_id}`}</span>
                              </div>
                              <div className="text-sm text-white/60 bg-[#2D4A5B] px-3 py-1 rounded-full">
                                {activity.class_name || `ห้องเรียน ${activity.a_cid}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                                เสร็จสิ้น
                              </div>
                              <div className="text-xs text-white/60 mt-1">
                                {formatDateTime(activity.h_time || activity.a_time).date}
                              </div>
                              <div className="text-xs text-white/60">
                                {formatDateTime(activity.h_time || activity.a_time).time}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-sm text-white/80">
                            <div className="flex items-center justify-between">
                              <span>
                                <span className="text-white/60">นักเรียน: </span>
                                <span className="text-white font-medium">{activity.student_name || 'ไม่ระบุชื่อ'}</span>
                                <span className="text-white/60 ml-2">(@{activity.student_username || 'ไม่ระบุ username'})</span>
                              </span>
                              <span className="text-white/60">{activity.homework_subject || 'ไม่ระบุวิชา'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-white/60 text-lg font-medium">ยังไม่มีนักเรียนส่งการบ้านที่เสร็จสิ้น</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      )}
    </div>
  );
}