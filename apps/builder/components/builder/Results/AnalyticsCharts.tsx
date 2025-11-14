"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Monitor, HelpCircle, Lock, MessageSquare } from "lucide-react";
import { cn } from "../../../lib/utils";

// Mock data for charts
const timeSeriesData = [
  { date: "16 oct.", views: 120 },
  { date: "18 oct.", views: 150 },
  { date: "20 oct.", views: 180 },
  { date: "22 oct.", views: 200 },
  { date: "24 oct.", views: 170 },
  { date: "26 oct.", views: 220 },
  { date: "28 oct.", views: 250 },
  { date: "30 oct.", views: 280 },
  { date: "1 nov.", views: 240 },
  { date: "3 nov.", views: 260 },
  { date: "5 nov.", views: 300 },
  { date: "7 nov.", views: 320 },
  { date: "9 nov.", views: 290 },
  { date: "11 nov.", views: 310 },
  { date: "13 nov.", views: 340 },
];

// Mock drop-off data
const dropOffData = [
  {
    id: "0a248b5e-35e1-4f69-8572-1a25c074f004",
    title: "Hey there 😀",
    color: "#fce7f3",
    icon: "💬",
    views: 192,
    dropoff: 55,
  },
  {
    id: "b05d203c-21c8-4899-b9fb-e89cb2c1921f",
    title: "",
    color: "#dbeafe",
    icon: "❓",
    views: 163,
    dropoff: 78,
  },
];

interface AnalyticsChartsProps {
  formId: string;
}

export function AnalyticsCharts({ formId }: AnalyticsChartsProps) {
  const [dateRange, setDateRange] = useState("all-time");
  const [deviceFilter, setDeviceFilter] = useState("all-devices");
  const [metricType, setMetricType] = useState("views");

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Date Range Dropdown */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all-time">All Time</option>
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="last-90-days">Last 90 days</option>
          </select>

          {/* Device Filter Dropdown */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
          >
            <option value="all-devices">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>

        <a
          href="https://help.youform.com/p/1p4zJnmzzWzbuL/Form-analytics-and-drop-off-rate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Help
        </a>
      </div>

      {/* Stat Cards (5 horizontal) - Reuse from ResultsTab */}
      <div className="grid grid-cols-5 gap-4">
        {/* Views */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-700">Views</span>
            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-blue-900">0</div>
          <p className="text-xs text-blue-600 mt-1">Total page views</p>
        </div>

        {/* Starts */}
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700">Starts</span>
            <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-purple-900">0</div>
          <p className="text-xs text-purple-600 mt-1">Form interactions</p>
        </div>

        {/* Submissions */}
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-700">Submissions</span>
            <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-green-900">0</div>
          <p className="text-xs text-green-600 mt-1">Completed forms</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-orange-700">Completion Rate</span>
            <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-orange-900">--</div>
          <p className="text-xs text-orange-600 mt-1">Completion rate</p>
        </div>

        {/* Completion Time */}
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-pink-700">Completion Time</span>
            <div className="w-4 h-4 rounded-full bg-pink-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-semibold text-pink-900">--</div>
          <p className="text-xs text-pink-600 mt-1">Avg completion</p>
        </div>
      </div>

      {/* PRO Warning Banner */}
      <div className="bg-pink-50 rounded-lg p-6 flex items-start gap-4 border border-pink-100">
        <Lock className="w-6 h-6 text-pink-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Analytics are limited
          </h3>
          <p className="text-sm text-gray-600">
            See trends and the drop-off rate for each question in your form.{' '}
            <a
              href="https://help.youform.com/p/1p4zJnmzzWzbuL/Form-analytics-and-drop-off-rate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Learn more
            </a>
          </p>
        </div>
        <button className="px-6 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium whitespace-nowrap transition-colors">
          Buy Youform Pro →
        </button>
      </div>

      {/* Trends Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Trends</h3>
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="views">Views</option>
            <option value="starts">Starts</option>
            <option value="submissions">Submissions</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[0, 500]}
              ticks={[0, 100, 200, 300, 400, 500]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#colorPurple)"
              name="Views"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* PRO Overlay */}
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 rounded-lg">
          <button className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded-md font-medium flex items-center gap-2 shadow-lg transition-colors">
            <Lock className="w-5 h-5" />
            Buy PRO
          </button>
        </div>
      </div>

      {/* Drop-off Rate Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 relative">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Drop-off Rate</h2>
        <p className="text-sm text-gray-600 mb-6">
          The drop-off rate shows the percentage of users who view a question but don't move past it.{' '}
          <a
            href="https://help.youform.com/p/1p4zJnmzzWzbuL/Form-analytics-and-drop-off-rate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Learn more
          </a>
          .
        </p>

        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 text-sm font-medium text-gray-500">Question</th>
              <th className="pb-3 text-sm font-medium text-gray-500">Views</th>
              <th className="pb-3 text-sm font-medium text-gray-500">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {dropOffData.map((block, index) => (
              <tr key={block.id} className="border-b">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-base"
                      style={{ backgroundColor: block.color }}
                    >
                      {block.icon}
                    </div>
                    <a
                      href={`/form/${formId}/build?block_id=${block.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {block.title || `Question ${index + 1}`}
                    </a>
                  </div>
                </td>
                <td className="py-4 text-gray-900">{block.views}</td>
                <td className="py-4">
                  <span className="font-semibold text-gray-900">
                    {block.dropoff}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PRO Overlay */}
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 rounded-lg">
          <button className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded-md font-medium flex items-center gap-2 shadow-lg transition-colors">
            <Lock className="w-5 h-5" />
            Buy PRO
          </button>
        </div>
      </div>
    </div>
  );
}
