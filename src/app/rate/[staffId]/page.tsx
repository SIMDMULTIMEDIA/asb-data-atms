"use client";

import { useState, use } from "react";
import { submitCustomerRating } from "@/services/crm";
import { Star, CheckCircle, AlertCircle } from "lucide-react";

export default function PublicRatingPage({ params }: { params: Promise<{ staffId: string }> }) {
  const resolvedParams = use(params);
  const { staffId } = resolvedParams;
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      await submitCustomerRating({
        staffId,
        rating,
        comment,
        source: "customer_public"
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError("Failed to submit rating. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600">Your feedback has been successfully submitted. We appreciate your time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0A3D91] rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">ASB</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Rate Your Experience</h1>
          <p className="text-slate-600 mt-2">How was your experience with our staff member?</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-12 h-12 ${
                    (hoveredRating || rating) >= star 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-slate-200"
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-[#0A3D91] focus:border-[#0A3D91] min-h-[120px]"
              placeholder="Tell us what you loved or how we can improve..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0A3D91] text-white rounded-xl font-medium hover:bg-[#082a63] transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </form>
      </div>
    </div>
  );
}
