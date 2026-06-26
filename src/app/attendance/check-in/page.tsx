"use client";
export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { calculateDistance, getActiveLocations, submitCheckIn, checkActiveAttendance } from "@/services/attendance";
import { validateAttendanceShift, getCurrentShift } from "@/services/shift";
import { CompanyLocation } from "@/types";
import { Camera, MapPin, ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UAParser } from "ua-parser-js";

export default function CheckInKiosk() {
  const { userData } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [nearestLocation, setNearestLocation] = useState<{location: CompanyLocation, distance: number} | null>(null);
  const [isWithinBounds, setIsWithinBounds] = useState<boolean | null>(null);
  
  const [shiftValid, setShiftValid] = useState<{valid: boolean, currentShift: string, reason?: string} | null>(null);
  
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData) return;

    const init = async () => {
      try {
        const active = await checkActiveAttendance(userData.uid);
        if (active) {
          setError("You are already checked in. Please check out before starting a new session.");
          setLoading(false);
          return;
        }

        const shiftCheck = validateAttendanceShift(userData.shift);
        setShiftValid(shiftCheck);
        if (!shiftCheck.valid) {
          setError(shiftCheck.reason || "Invalid shift.");
          setLoading(false);
          return;
        }

        const locs = await getActiveLocations();
        if (locs.length === 0) {
          setError("No active company locations found. Contact an administrator.");
          setLoading(false);
          return;
        }
        setLocations(locs);

        if (!navigator.geolocation) {
          setError("Geolocation is not supported by your browser.");
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setCurrentLocation({ lat: userLat, lng: userLng });

            let nearest: CompanyLocation | null = null;
            let minDistance = Infinity;

            for (const loc of locs) {
              const d = calculateDistance(userLat, userLng, loc.latitude, loc.longitude);
              if (d < minDistance) {
                minDistance = d;
                nearest = loc;
              }
            }

            if (nearest) {
              setNearestLocation({ location: nearest, distance: minDistance });
              setIsWithinBounds(minDistance <= nearest.radius);
            }
            
            startCamera();
            setLoading(false);
          },
          (err) => {
            console.error(err);
            if (err.code === err.PERMISSION_DENIED) {
              setError("Attendance requires Location Access. Please enable permissions in your browser settings and reload the page.");
            } else {
              setError("Failed to get your location.");
            }
            setLoading(false);
          },
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      } catch (err: any) {
        console.error(err);
        setError("Initialization failed: " + err.message);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [userData]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Attendance requires Camera Access. Please enable permissions in your browser settings and reload the page.");
      } else {
        setError("Could not access camera. Make sure no other application is using it.");
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));
      }
    }, "image/jpeg", 0.8);
  };

  const retakePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
  };

  const handleCheckIn = async () => {
    if (!userData || !currentLocation || !photoBlob || !isWithinBounds) return;
    
    setSubmitting(true);
    try {
      const parser = new UAParser();
      const result = parser.getResult();
      const deviceInfo = {
        browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
        operatingSystem: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
        platform: result.device.type || 'desktop'
      };

      const { isLate } = getCurrentShift();
      const status = isLate ? "late" : "present";
      
      const { Timestamp } = await import("firebase/firestore");

      await submitCheckIn({
        userId: userData.uid,
        shift: userData.shift,
        status,
        checkIn: Timestamp.now(),
        location: {
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        },
        deviceInfo
      }, photoBlob);

      router.push("/attendance");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to check in.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0A3D91] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Initializing Secure Kiosk...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91]">Secure Check-In</h1>
            <p className="text-slate-600">Please verify your location and identity.</p>
          </div>
          <Link href="/attendance" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Cancel
          </Link>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-700 mb-2">Check-In Unavailable</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-medium flex items-center space-x-2">
                <Camera className="w-5 h-5 text-slate-500" />
                <span>Selfie Verification</span>
              </div>
              <div className="relative flex-1 bg-black min-h-[300px]">
                {!photoPreview ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={photoPreview} 
                    alt="Selfie preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                {!photoPreview ? (
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-[#0A3D91] border-4 border-blue-200 shadow-md hover:scale-105 transition-transform"
                    aria-label="Take photo"
                  />
                ) : (
                  <button 
                    onClick={retakePhoto}
                    className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Retake Photo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              
              <div className={`p-6 rounded-2xl border ${isWithinBounds ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${isWithinBounds ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isWithinBounds ? 'text-green-800' : 'text-red-800'}`}>
                      {isWithinBounds ? 'Location Verified' : 'Out of Bounds'}
                    </h3>
                    {nearestLocation && (
                      <p className={`text-sm mt-1 ${isWithinBounds ? 'text-green-600' : 'text-red-600'}`}>
                        {isWithinBounds 
                          ? `You are within the allowed radius of ${nearestLocation.location.name}.` 
                          : `You are ${Math.round(nearestLocation.distance)}m away from ${nearestLocation.location.name}. Max allowed is ${nearestLocation.location.radius}m.`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800">Shift Verified</h3>
                    <p className="text-sm mt-1 text-blue-600">
                      You are assigned to the <strong>{userData?.shift} Shift</strong>, which matches the current active schedule.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={!isWithinBounds || !photoBlob || submitting}
                className="w-full py-4 bg-[#0A3D91] hover:bg-[#082a63] text-white rounded-xl font-bold text-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Processing..." : "Complete Check-In"}
              </button>

            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
