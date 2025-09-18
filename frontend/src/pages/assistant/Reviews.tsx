import { useState, useEffect } from "react";
import { 
  Search, Star, User, Calendar, CheckCircle, Filter, 
  TrendingUp, Award, MessageSquare, ThumbsUp, Eye,
  BarChart3, Users, Clock, Sparkles, ArrowRight,
  ChevronDown, Heart, BookOpen, Target, Zap
} from "lucide-react";

// Types
interface Student {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

interface Review {
  id: string;
  student: Student;
  rating: number;
  feedback: string;
  course: string;
  date: string;
  isVerified: boolean;
  helpful?: number;
  subject?: string;
}

interface ReviewStatsType {
  average: number;
  total: number;
  positive: string;
  thisMonth: number;
  distribution: { [key: number]: number };
}

// Mock Data
const mockReviewStats: ReviewStatsType = {
  average: 4.8,
  total: 127,
  positive: "92%",
  thisMonth: 23,
  distribution: {
    5: 85,
    4: 28,
    3: 10,
    2: 3,
    1: 1
  }
};

const mockReviews: Review[] = [
  {
    id: "1",
    student: { id: "1", name: "Ahmed Hassan", initials: "AH" },
    rating: 5,
    feedback: "Exceptional TA! Sarah's explanations during office hours were incredibly clear and helped me understand complex dental anatomy concepts. Her feedback on assignments was detailed and constructive. The way she broke down difficult topics made everything so much easier to grasp. Highly recommend!",
    course: "Oral Biology - DENT 201",
    date: "2 days ago",
    isVerified: true,
    helpful: 12,
    subject: "Office Hours Support"
  },
  {
    id: "2", 
    student: { id: "2", name: "Maria Garcia", initials: "MG" },
    rating: 5,
    feedback: "Outstanding teaching assistant! Always available to help and responds to emails quickly. The lab sessions were well-organized and she made sure everyone understood the procedures before moving on. Her patience with struggling students is remarkable.",
    course: "Dental Anatomy - DENT 150", 
    date: "5 days ago",
    isVerified: true,
    helpful: 8,
    subject: "Lab Assistance"
  },
  {
    id: "3",
    student: { id: "3", name: "John Martinez", initials: "JM" },
    rating: 4,
    feedback: "Great support throughout the semester. Sarah knows the material very well and can explain it in different ways until you understand. Sometimes office hours get crowded, but she manages her time well. Would definitely take another course with her as TA.",
    course: "Oral Pathology - DENT 301",
    date: "1 week ago", 
    isVerified: true,
    helpful: 15,
    subject: "Course Support"
  },
  {
    id: "4",
    student: { id: "4", name: "Lisa Chen", initials: "LC" },
    rating: 5,
    feedback: "Incredible TA! Her passion for dentistry is contagious and she makes even the most challenging topics interesting. The study sessions she organized before exams were a lifesaver. She goes above and beyond to help students succeed.",
    course: "Oral Biology - DENT 201",
    date: "1 week ago",
    isVerified: true,
    helpful: 20,
    subject: "Exam Preparation"
  },
  {
    id: "5",
    student: { id: "5", name: "David Kim", initials: "DK" },
    rating: 4,
    feedback: "Very knowledgeable and helpful TA. Good at explaining complex concepts in simple terms. The only improvement would be having more office hours available, but I understand she's busy with multiple courses.",
    course: "Dental Materials - DENT 250",
    date: "2 weeks ago",
    isVerified: true,
    helpful: 6,
    subject: "Concept Explanation"
  },
  {
    id: "6",
    student: { id: "6", name: "Emma Wilson", initials: "EW" },
    rating: 5,
    feedback: "Sarah is an amazing TA! Her feedback on lab reports was thorough and helped me improve my scientific writing. She's also great at connecting theoretical knowledge to practical applications in dentistry.",
    course: "Research Methods - DENT 400",
    date: "3 weeks ago",
    isVerified: true,
    helpful: 11,
    subject: "Academic Writing"
  }
];

// Components
const ReviewStats = ({ stats }: { stats: ReviewStatsType }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Average Rating */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 group hover:scale-105 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Excellent</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-3xl font-black text-white">{stats.average}</h3>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(stats.average) ? 'text-yellow-400 fill-current' : 'text-white/30'}`} 
              />
            ))}
          </div>
        </div>
        <p className="text-white/70 text-sm font-medium">Average Rating</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-yellow-300">Based on {stats.total} reviews</span>
        </div>
      </div>

      {/* Total Reviews */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 group hover:scale-105 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-blue-400 text-sm">
            <Users className="w-4 h-4" />
            <span>Total</span>
          </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">{stats.total}</h3>
        <p className="text-white/70 text-sm font-medium">Total Reviews</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs text-blue-300">From students</span>
        </div>
      </div>

      {/* Positive Feedback */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 group hover:scale-105 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ThumbsUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-green-400 text-sm">
            <Heart className="w-4 h-4" />
            <span>Positive</span>
          </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">{stats.positive}</h3>
        <p className="text-white/70 text-sm font-medium">Positive Feedback</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-300">4+ star ratings</span>
        </div>
      </div>

      {/* This Month */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 group hover:scale-105 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-1 text-purple-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-2">{stats.thisMonth}</h3>
        <p className="text-white/70 text-sm font-medium">This Month</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <span className="text-xs text-purple-300">New reviews</span>
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-white/30'}`} 
      />
    ));
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{review.student.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-white font-bold">{review.student.name}</h4>
              {review.isVerified && (
                <div className="flex items-center gap-1 bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
            </div>
            <p className="text-cyan-300 text-sm">{review.course}</p>
            {review.subject && (
              <p className="text-white/50 text-xs mt-1">{review.subject}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">{renderStars(review.rating)}</div>
            <span className="text-white/70 text-sm">({review.rating}.0)</span>
          </div>
          <p className="text-white/50 text-sm">{review.date}</p>
        </div>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        <p className="text-white/80 leading-relaxed">{review.feedback}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-white/60 hover:text-purple-300 transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm">Helpful ({review.helpful})</span>
          </button>
          <button className="flex items-center gap-2 text-white/60 hover:text-cyan-300 transition-colors">
            <Eye className="w-4 h-4" />
            <span className="text-sm">View Details</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            review.rating >= 5 ? 'bg-green-500/20 text-green-300' :
            review.rating >= 4 ? 'bg-blue-500/20 text-blue-300' :
            review.rating >= 3 ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {review.rating >= 4 ? 'Positive' : review.rating >= 3 ? 'Neutral' : 'Needs Improvement'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Reviews() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [isAnimated, setIsAnimated] = useState(false);
  const [reviewStats, setReviewStats] = useState(mockReviewStats);
  const [reviews, setReviews] = useState(mockReviews);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsAnimated(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter reviews based on search and rating
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.subject && review.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
    
    return matchesSearch && matchesRating;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1000ms'}} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '500ms'}} />
        </div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                Student Reviews
              </h1>
              <p className="text-white/70 text-lg">Feedback and ratings from your students</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reviews, students, or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                  />
                </div>

                {/* Rating Filter */}
                <div className="relative">
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 cursor-pointer"
                  >
                    <option value="all" className="bg-gray-800">All Ratings</option>
                    <option value="5" className="bg-gray-800">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4" className="bg-gray-800">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3" className="bg-gray-800">⭐⭐⭐ (3 Stars)</option>
                    <option value="2" className="bg-gray-800">⭐⭐ (2 Stars)</option>
                    <option value="1" className="bg-gray-800">⭐ (1 Star)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Filter Info */}
              <div className="flex items-center gap-2 text-white/60">
                <Filter className="w-4 h-4" />
                <span className="text-sm">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '200ms'}}>
          <ReviewStats stats={reviewStats} />
        </div>

        {/* Reviews List */}
        <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '400ms'}}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Recent Reviews</h3>
              </div>
              <button className="group flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors">
                <span>Export Reviews</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-6">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="transform transition-all duration-500"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <ReviewCard review={review} />
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-white/40" />
                  </div>
                  <h4 className="text-white text-xl font-bold mb-2">No Reviews Found</h4>
                  <p className="text-white/70 max-w-md mx-auto">
                    No reviews match your current search criteria. Try adjusting your filters or search terms.
                  </p>
                </div>
              )}
            </div>

            {/* Load More Button */}
            {filteredReviews.length > 0 && filteredReviews.length >= 6 && (
              <div className="text-center mt-12">
                <button className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center gap-3 mx-auto shadow-2xl hover:shadow-purple-500/25">
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Load More Reviews</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className={`mt-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '600ms'}}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="group bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-bold p-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] text-left shadow-2xl hover:shadow-blue-500/25">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Analytics</h4>
                  <p className="text-sm opacity-80">Detailed insights</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold p-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] text-left shadow-2xl hover:shadow-emerald-500/25">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Improve</h4>
                  <p className="text-sm opacity-80">Action items</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold p-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] text-left shadow-2xl hover:shadow-purple-500/25">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Resources</h4>
                  <p className="text-sm opacity-80">Teaching tips</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}