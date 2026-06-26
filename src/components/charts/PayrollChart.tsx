"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function PayrollChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
        <Legend verticalAlign="top" height={36}/>
        <Bar dataKey="base" stackId="a" fill="#0A3D91" name="Base Salary" />
        <Bar dataKey="bonus" stackId="a" fill="#3b82f6" name="Bonuses" />
        <Bar dataKey="comms" stackId="a" fill="#93c5fd" name="Commissions" />
      </BarChart>
    </ResponsiveContainer>
  );
}
