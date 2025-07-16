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

  // Get dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        console.log("Fetching dashboard data...");
        
        // Test database connection first
        const dbTest = await testDatabaseConnection();
        console.log("Database test result:", dbTest);
        
        // Test homework action
        const homeworkTest = await getHomework();
        console.log("Homework action test:", homeworkTest);
        
        // Get real data from database
        const [statsRes, homeworkRes] = await Promise.all([
          getDashboardStats(),
          getLowestScoringHomework()
        ]);

        console.log("Dashboard stats response:", statsRes);
        console.log("Homework response:", homeworkRes);

        if (statsRes.type === 'success') {
          setDashboardStats(statsRes);
        } else {
          console.error("Dashboard stats error:", statsRes);
        }
        
        if (Array.isArray(homeworkRes)) {
          setLowestScoringHomework(homeworkRes);
        } else {
          console.error("Homework data is not array:", homeworkRes);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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
                  <div className="text-white text-xl">กำลังโหลดข้อมูล...</div>
                </div>
              ) : (
                <>
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