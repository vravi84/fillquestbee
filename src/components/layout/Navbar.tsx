'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, BookOpen, LogOut, User, LayoutDashboard, PlusCircle, Award, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isDemoAccount, loginAsDemoTeacher } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStudentView = pathname?.startsWith('/exam/');
  const isAdminView = pathname?.startsWith('/admin');

  if (isAdminView) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-indigo-100 shadow-xs">
      {/* Optional Top Alert Banner if in Demo Mode */}
      {isDemoAccount && !isStudentView && (
        <div className="bg-amber-500 text-slate-900 text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
          <span>⚡ <strong>Demo Mode Active</strong> — Experience full FillQuestBee exam creation & student drag & drop out of the box!</span>
        </div>
      )}

      <div className="max-w-7xl 2xl:max-w-[1600px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 text-indigo-700 hover:text-indigo-800 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl 2xl:text-2xl tracking-tight bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                FillQuestBee Studio
              </span>
              <span className="text-[9px] sm:text-[10px] 2xl:text-xs text-slate-500 font-semibold uppercase tracking-wider -mt-0.5 sm:-mt-1">
                AI Interactive Fill-in-the-Blank Exams
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <Link
                  href="/teacher/dashboard"
                  className={`flex items-center gap-1.5 text-sm 2xl:text-base font-semibold px-3.5 py-2 rounded-xl transition-colors ${
                    pathname === '/teacher/dashboard'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 2xl:w-5 2xl:h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/teacher/exams/create"
                  className="flex items-center gap-1.5 text-sm 2xl:text-base font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all transform active:scale-95"
                >
                  <PlusCircle className="w-4 h-4 2xl:w-5 2xl:h-5" />
                  <span>Create Exam</span>
                </Link>

                {/* Profile Badge */}
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm 2xl:text-base border border-indigo-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-xs 2xl:text-sm font-semibold text-slate-800 leading-none">{user.name}</span>
                    <span className="text-[10px] 2xl:text-xs text-slate-500 leading-none mt-0.5">Teacher</span>
                  </div>
                  <button
                    onClick={() => logout()}
                    title="Logout"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4 2xl:w-5 2xl:h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={loginAsDemoTeacher}
                  className="text-xs sm:text-sm 2xl:text-base font-semibold px-3.5 py-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                >
                  ⚡ Try Quick Demo
                </button>
                <Link
                  href="/teacher/login"
                  className="text-sm 2xl:text-base font-semibold px-4 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/teacher/register"
                  className="text-sm 2xl:text-base font-semibold px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all"
                >
                  Teacher Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 px-2 border-t border-slate-100 space-y-3 bg-white animate-fade-in">
            {user ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>

                <Link
                  href="/teacher/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  Dashboard
                </Link>

                <Link
                  href="/teacher/exams/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New Exam
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    loginAsDemoTeacher();
                  }}
                  className="w-full py-3 text-xs font-bold text-amber-800 bg-amber-50 rounded-xl border border-amber-200"
                >
                  ⚡ Try Quick Demo Mode
                </button>
                <Link
                  href="/teacher/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-3 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  href="/teacher/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-sm"
                >
                  Teacher Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
