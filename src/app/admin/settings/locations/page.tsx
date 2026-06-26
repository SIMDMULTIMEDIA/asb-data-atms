"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CompanyLocation } from "@/types";
import { MapPin, Plus, Save, Edit2 } from "lucide-react";

export default function CompanyLocationsSettings() {
  const { userData } = useAuth();
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Partial<CompanyLocation>>({});

  useEffect(() => {
    if (!userData || userData.role !== 'super_admin') {
      return;
    }

    const q = query(collection(getFirebaseDb() as any, "company_locations"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyLocation));
      setLocations(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleSave = async () => {
    if (!editingLoc.name || !editingLoc.latitude || !editingLoc.longitude || !editingLoc.radius) {
      alert("All fields are required.");
      return;
    }

    try {
      if (editingLoc.id) {
        await updateDoc(doc(getFirebaseDb() as any, "company_locations", editingLoc.id), {
          name: editingLoc.name,
          latitude: Number(editingLoc.latitude),
          longitude: Number(editingLoc.longitude),
          radius: Number(editingLoc.radius),
          active: editingLoc.active ?? true
        });
      } else {
        const newId = `LOC-${Date.now()}`;
        await setDoc(doc(getFirebaseDb() as any, "company_locations", newId), {
          name: editingLoc.name,
          latitude: Number(editingLoc.latitude),
          longitude: Number(editingLoc.longitude),
          radius: Number(editingLoc.radius),
          active: editingLoc.active ?? true
        });
      }
      setIsEditing(false);
      setEditingLoc({});
    } catch (err) {
      console.error(err);
      alert("Failed to save location.");
    }
  };

  const handleToggleActive = async (loc: CompanyLocation) => {
    try {
      await updateDoc(doc(getFirebaseDb() as any, "company_locations", loc.id as string), {
        active: !loc.active
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <AuthGuard requiredRole="super_admin">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D91]">Geo-Fence Settings</h1>
            <p className="text-slate-600">Configure allowed check-in perimeters for staff attendance.</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => { setEditingLoc({ active: true, radius: 100 }); setIsEditing(true); }}
              className="flex items-center space-x-2 bg-[#0A3D91] hover:bg-[#082a63] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          )}
        </div>

        {isEditing && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingLoc.id ? "Edit Location" : "New Location"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Name</label>
                <input 
                  type="text" 
                  value={editingLoc.name || ""}
                  onChange={(e) => setEditingLoc({...editingLoc, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A3D91]"
                  placeholder="e.g. Headquarters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Radius (meters)</label>
                <input 
                  type="number" 
                  value={editingLoc.radius || ""}
                  onChange={(e) => setEditingLoc({...editingLoc, radius: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A3D91]"
                  placeholder="e.g. 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={editingLoc.latitude || ""}
                  onChange={(e) => setEditingLoc({...editingLoc, latitude: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A3D91]"
                  placeholder="e.g. 12.1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                <input 
                  type="number" 
                  step="any"
                  value={editingLoc.longitude || ""}
                  onChange={(e) => setEditingLoc({...editingLoc, longitude: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A3D91]"
                  placeholder="e.g. 8.5678"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleSave}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Location</span>
              </button>
              <button 
                onClick={() => { setIsEditing(false); setEditingLoc({}); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map(loc => (
            <div key={loc.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${loc.active ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${loc.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{loc.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {loc.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm text-slate-500">Radius: {loc.radius}m</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setEditingLoc(loc); setIsEditing(true); }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="block text-slate-400 text-xs uppercase font-semibold">Latitude</span>
                  <span className="font-medium">{loc.latitude}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-xs uppercase font-semibold">Longitude</span>
                  <span className="font-medium">{loc.longitude}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleToggleActive(loc)}
                  className={`text-sm font-medium ${loc.active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                >
                  {loc.active ? 'Deactivate Location' : 'Activate Location'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AuthGuard>
  );
}
