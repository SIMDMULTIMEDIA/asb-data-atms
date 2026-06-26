import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#0A3D91] opacity-[0.03] blur-3xl" />
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#F5A623] opacity-[0.05] blur-3xl" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 flex justify-center mb-6">
        <div className="h-16 w-16 bg-[#0A3D91] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0A3D91]/20">
          <span className="text-white text-2xl font-black tracking-tighter">ASB</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
