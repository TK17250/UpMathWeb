'use client'; // Add this if not present
import React, { useEffect, useState } from 'react';
import { getUserData } from '../action/getuser';

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    // Use state to avoid window is not defined error during server-side rendering
    const [activePage, setActivePage] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActivePage(window.location.pathname);
        }
    }, []);

    // Get user data
    useEffect(() => {
        getUserData().then((data) => {
            if (data) {
                setUserData(data);
            }
        })
    }, [])

    // Thai month names
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Thai weekday abbreviated names
    const thaiWeekdays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

    // Calendar state
    const [calendar, setCalendar] = useState({
        year: 0,
        month: 0,
        thaiYear: 0,
        thaiMonth: '',
        days: [] as (number | null)[],
        currentDay: 0
    });

    // Generate calendar days for the month
    useEffect(() => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const thaiYear = currentYear + 543;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const days: (number | null)[] = Array(firstDayOfMonth).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        setCalendar({
            year: currentYear,
            month: currentMonth,
            thaiYear: thaiYear,
            thaiMonth: thaiMonths[currentMonth],
            days: days,
            currentDay: currentDay
        });
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const menuItems = [
        { id: '/', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2', text: 'แดชบอร์ด' },
        { id: '/classs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', text: 'ชั้นเรียนทั้งหมด' },
        { id: '/homework', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', text: 'คลังชุดฝึก' },
        { id: '/medias', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', text: 'คลังสื่อการเรียนรู้' },
        { id: '/activities', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', text: 'ประวัติกิจกรรม' },
        { id: '/setting', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', text: 'ตั้งค่าบัญชี' },
    ];

    return (
        // The change is in the line below.
        // Removed `h-full` and added `lg:h-full` to the root div.
        <div className="lg:h-full"> 
            {/* Hamburger button for mobile */}
            <button
                className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-[#203D4F] border-4 border-[#002D4A] text-white outline-none"
                onClick={toggleSidebar}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Sidebar mobile */}
            <div
                className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-[#203D4F] overflow-y-auto lg:hidden`}
            >
                <nav className="mt-5 px-2">
                    {menuItems.map((item) => (
                        <a
                            key={item.id}
                            href={`${item.id}`}
                            className={`flex items-center px-4 py-3 mt-1 rounded-xl text-sm ${activePage === item.id
                                ? 'text-[#80ED99] font-bold bg-[#2D4A5B] shadow-[0_0_30px_0_#2D4A5B]'
                                : 'text-white hover:bg-[#2D4A5B]'
                                } transition-colors duration-200`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            <span>{item.text}</span>
                        </a>
                    ))}
                </nav>

                <hr className='mx-3 my-2 text-[#CCCCCC]' />

                {/* Calendar */}
                <div className="mx-3 p-4 bg-[#2D4A5B] rounded-xl mt-5 mb-5">
                    <h3 className="text-white font-medium mb-2">ปฏิทิน</h3>
                    <div className="text-center text-white mb-2">
                        <span className="font-medium">{calendar.thaiMonth} {calendar.thaiYear}</span>
                    </div>
                    <div className="text-xs text-center text-gray-300">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {thaiWeekdays.map((day, index) => (
                                <div key={index} className="text-gray-400">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendar.days.map((day, index) => (
                                <div
                                    key={index}
                                    className={`p-1 ${day === calendar.currentDay
                                        ? 'bg-[#80ED99] text-[#203D4F] font-bold rounded-full'
                                        : day ? 'text-white' : ''
                                        }`}
                                >
                                    {day || ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar desktop */}
            <div className="hidden lg:flex lg:flex-col h-full justify-between lg:w-64 mt-5 overflow-y-auto">
                <div className="mx-3 p-4 bg-[#203D4F] rounded-xl hidden xl:block mb-5">
                    <h2 className="text-white font-bold text-lg">สวัสดีคุณ</h2>
                    <p className="text-gray-400">{userData?.t_fullname}</p>
                </div>

                <nav className="mx-3 p-4 bg-[#203D4F] rounded-xl">
                    {menuItems.map((item) => (
                        <a
                            key={item.id}
                            href={`${item.id}`}
                            className={`flex items-center px-4 py-3 mt-1 rounded-xl text-sm ${activePage === item.id
                                ? 'text-[#80ED99] font-bold bg-[#2D4A5B] shadow-[0_0_30px_0_#2D4A5B]'
                                : 'text-white hover:bg-[#2D4A5B]'
                                } transition-colors duration-200`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                            </svg>
                            <span>{item.text}</span>
                        </a>
                    ))}
                </nav>

                <div className="mx-3 p-4 bg-[#203D4F] rounded-xl mb-5 mt-5">
                    <h3 className="text-white font-medium mb-2">ปฏิทิน</h3>
                    <div className="text-center text-white mb-2">
                        <span className="font-medium">{calendar.thaiMonth} {calendar.thaiYear}</span>
                    </div>
                    <div className="text-xs text-center text-gray-300">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {thaiWeekdays.map((day, index) => (
                                <div key={index} className="text-gray-400">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendar.days.map((day, index) => (
                                <div
                                    key={index}
                                    className={`p-1 ${day === calendar.currentDay
                                        ? 'bg-[#80ED99] text-[#203D4F] font-bold rounded-full'
                                        : day ? 'text-white' : ''
                                        }`}
                                >
                                    {day || ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dark overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black opacity-50 z-20"
                    onClick={toggleSidebar}
                ></div>
            )}
        </div>
    );
};

export default Sidebar;