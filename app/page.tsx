'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser } from "./action/getuser";
import { getDashboardStats, getLowestScoringHomework, testDatabaseConnection } from "./action/dashboard";
import { getHomework } from "./action/homework";
import Navbar from "./component/navbar";
import Sidebar from "./component/sidebar";
import Footer from "./component/footer";
import StatCard from "./component/stat-card";
import ChartBar from "./component/chart-bar";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [lowestScoringHomework, setLowestScoringHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Single useEffect to handle all data fetching
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Starting app initialization...");
        
        // First, get and verify user authentication
        const userRes = await getUser();
        
        if (!isMounted) return;
        
        if (!userRes) {
          router.push("/login");
          return;
        }
        
        console.log("User authenticated, setting user data...");
        setUser(userRes);
        
        // Fetch all dashboard data in parallel for better performance
        console.log("Fetching dashboard data in parallel...");
        
        const [statsRes, homeworkRes] = await Promise.all([
          getDashboardStats().catch(err => {
            console.error("Dashboard stats error:", err);
            return { type: 'error', message: 'Failed to load stats' };
          }),
          getLowestScoringHomework().catch(err => {
            console.error("Homework data error:", err);
            return [];
          })
        ]);

        if (!isMounted) return;

        console.log("Dashboard stats response:", statsRes);
        console.log("Homework response:", homeworkRes);

        // Set dashboard stats
        if (statsRes && statsRes.type === 'success') {
          setDashboardStats(statsRes);
        } else {
          console.error("Dashboard stats error:", statsRes);
          // Still set some default data to prevent UI issues
          setDashboardStats({
            type: 'success',
            data: {
              totalClasses: 0,
              totalHomework: 0,
              totalMedia: 0,
              topSubjects: []
            }
          });
        }
        
        // Set homework data
        if (Array.isArray(homeworkRes)) {
          setLowestScoringHomework(homeworkRes);
        } else {
          console.error("Homework data is not array:", homeworkRes);
          setLowestScoringHomework([]);
        }

        console.log("App initialization completed successfully");
        
      } catch (error: any) {
        console.error('Critical error during app initialization:', error);
        
        if (isMounted) {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
          
          // Set minimal data to prevent crashes
          setDashboardStats({
            type: 'success',
            data: {
              totalClasses: 0,
              totalHomework: 0,
              totalMedia: 0,
              topSubjects: []
            }
          });
          setLowestScoringHomework([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeApp();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Error boundary component
  if (error && !loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
          <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a1a1a] opacity-70">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <div className="text-white text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-col h-full w-11/12 mx-auto">
        {/* Navbar */}
        <Navbar />

        <div className="flex flex-grow flex-col lg:flex-row overflow-hidden relative">
          {/* Sidebar */}
          <div className="w-full lg:w-auto lg:flex-shrink-0">
            <Sidebar />
          </div>

          {/* Content */}
          <div className="bg-[#2D4A5B] mt-5 mb-5 lg:mb-0 rounded-xl w-full h-full lg:h-auto border-4 border-[#203D4F] p-5 overflow-y-auto">
            
            {/* Stats Cards */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="จำนวนห้องเรียน"
                  value={`${dashboardStats.data?.totalClasses || 0} ห้องเรียน`}
                />
                <StatCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="จำนวนชุดฝึก"
                  value={`${dashboardStats.data?.totalHomework || 0} ชุดฝึก`}
                />
                <StatCard
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  }
                  title="จำนวนสื่อการเรียนรู้"
                  value={`${dashboardStats.data?.totalMedia || 0} สื่อการเรียนรู้`}
                />
              </div>
            )}

            {/* Middle Section - Top 10 Chart */}
            <div className="mb-8">
              <div className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B]">
                <h2 className="text-white text-xl font-bold mb-4">
                  จำนวนชุดฝึกของแต่ละชั้นเรียน
                </h2>
                <div className="h-48">
                  {lowestScoringHomework.length > 0 ? (
                    <ChartBar data={lowestScoringHomework} maxItems={10} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      <p>ยังไม่มีข้อมูลชุดฝึกในห้องเรียน</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left Side - Subjects Chart */}
                {dashboardStats?.data?.topSubjects && dashboardStats.data.topSubjects.length > 0 ? (
                  <div className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B]">
                    <h2 className="text-white text-xl font-bold mb-4">
                      ชุดฝึกที่นักเรียนทำเสร็จมากที่สุด 5 อันดับแรก (คน)
                    </h2>
                    <div className="h-48">
                      <ChartBar 
                        data={dashboardStats.data.topSubjects.map((subject: any) => ({
                          name: subject.subject,
                          count: subject.count
                        }))} 
                        maxItems={5}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B]">
                    <h2 className="text-white text-xl font-bold mb-4">
                      ชุดฝึกที่นักเรียนทำเสร็จมากที่สุด 5 อันดับแรก (คน)
                    </h2>
                    <div className="text-center text-white/60 py-8">
                      <p>ยังไม่มีข้อมูลชุดฝึกที่นักเรียนทำเสร็จ</p>
                    </div>
                  </div>
                )}

                {/* Right Side - Navigation Widgets */}
                <div className="space-y-4">
                  <div 
                    className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B] hover:border-[#80ED99] transition-all duration-300 cursor-pointer"
                    onClick={() => router.push('/homework')}
                  >
                    <div className="flex items-center space-x-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="text-white text-lg font-semibold">เพิ่มชุดฝึก</div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-[#203D4F] rounded-xl p-6 border-4 border-[#2D4A5B] hover:border-[#80ED99] transition-all duration-300 cursor-pointer"
                    onClick={() => router.push('/medias')}
                  >
                    <div className="flex items-center space-x-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#80ED99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div>
                        <div className="text-white text-lg font-semibold">เพิ่มสื่อการเรียนรู้</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
             
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}