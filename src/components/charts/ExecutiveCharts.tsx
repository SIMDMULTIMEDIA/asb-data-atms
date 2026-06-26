"use client";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AttendanceChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
        <Tooltip 
          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
        />
        <Line type="monotone" dataKey="rate" stroke="#0A3D91" strokeWidth={3} dot={{r: 4, fill: '#0A3D91', strokeWidth: 2}} activeDot={{r: 6}} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PayrollTrendChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0A3D91" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0A3D91" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip 
          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
        />
        <Area type="monotone" dataKey="cost" stroke="#0A3D91" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
