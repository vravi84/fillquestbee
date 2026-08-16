import React from 'react';
import { BookOpen, CheckCircle, Users, Award } from 'lucide-react';
import { Exam, ExamAttempt } from '@/types';

interface DashboardCardsProps {
  exams: Exam[];
  attempts: ExamAttempt[];
}

export default function DashboardCards({ exams, attempts }: DashboardCardsProps) {
  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.status === 'published').length;
  const totalAttempts = attempts.length;
  
  const avgScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length
        )
      : 0;

  const cards = [
    {
      title: 'Total Exams',
      value: totalExams,
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      title: 'Published Exams',
      value: publishedExams,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'Total Attempts',
      value: totalAttempts,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50 text-purple-700 border-purple-100',
    },
    {
      title: 'Average Student Score',
      value: `${avgScore}%`,
      icon: Award,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.bgLight}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>

            <div className={`h-1 w-full bg-gradient-to-r ${card.color} rounded-full mt-4 opacity-80`} />
          </div>
        );
      })}
    </div>
  );
}
