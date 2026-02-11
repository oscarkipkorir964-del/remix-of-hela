import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Sparkles, Home, Landmark, PiggyBank, TrendingUp, Users, Clock, Star, Quote } from "lucide-react";
import zenkaLogo from "@/assets/zenka-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const testimonials = [
  {
    name: "Kevin Kipyegon",
    location: "Nairobi",
    rating: 5,
    text: "I got my loan in just 5 minutes! Zenka saved me when I needed emergency funds for my business.",
    amount: "KSh 8,500"
  },
  {
    name: "Grace Wanjiku",
    location: "Nakuru",
    rating: 5,
    text: "Very fast and reliable. The interest rates are fair and the repayment is flexible.",
    amount: "KSh 12,000"
  },
  {
    name: "Brian Odhiambo",
    location: "Kisumu",
    rating: 5,
    text: "Best loan app in Kenya! No hidden charges and the customer service is excellent.",
    amount: "KSh 6,000"
  },
  {
    name: "Faith Cherono",
    location: "Eldoret",
    rating: 5,
    text: "Simple process, no paperwork. I recommend Zenka to all my friends and family.",
    amount: "KSh 10,000"
  },
  {
    name: "Dennis Mutua",
    location: "Machakos",
    rating: 5,
    text: "I've used many loan apps but Zenka is the best. Quick disbursement directly to M-Pesa!",
    amount: "KSh 14,500"
  },
  {
    name: "Mary Njeri",
    location: "Thika",
    rating: 5,
    text: "Lifesaver! Got funds for my daughter's school fees within minutes. Thank you Zenka!",
    amount: "KSh 9,000"
  },
  {
    name: "Peter Otieno",
    location: "Mombasa",
    rating: 5,
    text: "The app is very easy to use. Even my grandmother can apply for a loan!",
    amount: "KSh 7,500"
  },
  {
    name: "Sarah Kosgei",
    location: "Kericho",
    rating: 5,
    text: "Trusted and transparent. I always know exactly what I'm paying back.",
    amount: "KSh 11,000"
  },
  {
    name: "James Mwangi",
    location: "Nyeri",
    rating: 5,
    text: "Zenka has helped me grow my small business. The loan limits keep increasing!",
    amount: "KSh 15,000"
  },
  {
    name: "Agnes Akinyi",
    location: "Kisii",
    rating: 5,
    text: "Fast approval and no stress. I got my money before I even finished my tea!",
    amount: "KSh 5,500"
  },
  {
    name: "Samuel Kibet",
    location: "Uasin Gishu",
    rating: 5,
    text: "Very professional service. The repayment reminders help me stay on track.",
    amount: "KSh 13,000"
  },
  {
    name: "Caroline Muthoni",
    location: "Kiambu",
    rating: 5,
    text: "I was skeptical at first but Zenka proved me wrong. Genuine and reliable!",
    amount: "KSh 8,000"
  },
  {
    name: "Michael Ouma",
    location: "Homa Bay",
    rating: 5,
    text: "Emergency funds when I needed them most. Zenka is a blessing!",
    amount: "KSh 10,500"
  },
  {
    name: "Joyce Wambui",
    location: "Muranga",
    rating: 5,
    text: "The customer support team is amazing. They helped me through every step.",
    amount: "KSh 7,000"
  },
  {
    name: "David Kimani",
    location: "Nairobi",
    rating: 5,
    text: "Best rates in the market! I've compared with others and Zenka wins.",
    amount: "KSh 20,000"
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: false }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50/50 to-emerald-50/30 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img 
            src={zenkaLogo} 
            alt="Zenka" 
            className="h-10 w-auto"
          />
          <span className="font-bold text-xl text-foreground">Zenka</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <main className="px-6 pb-32">
        <div className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto pt-4">
          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-6 w-full py-3 px-4 bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">1M+ Users</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">KSh 2B+ Disbursed</span>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Get Instant Cash{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
                When You Need It
              </span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Apply in 2 minutes, get approved instantly, and receive funds directly to your M-Pesa.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="w-full space-y-3">
            <Button 
              variant="cute" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full py-6 text-lg rounded-full shadow-lg shadow-primary/25"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Apply Now
            </Button>
            <p className="text-xs text-muted-foreground">No hidden fees • No paperwork • 24/7 available</p>
          </div>

          {/* Testimonials Carousel */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Quote className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">What Our Users Say</h2>
            </div>
            <Carousel
              plugins={[plugin.current]}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-2">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-2 basis-[85%]">
                    <div className="bg-card/90 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-border/50 h-full">
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                        </div>
                        <div className="bg-primary/10 px-3 py-1 rounded-full">
                          <span className="text-xs font-semibold text-primary">{testimonial.amount}</span>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Features Grid */}
          <div className="w-full grid grid-cols-2 gap-3 mt-6">
            {/* Fast Approval */}
            <div className="bg-card/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">2-Min Approval</h3>
              <p className="text-muted-foreground text-xs">Get approved in minutes</p>
            </div>

            {/* Secure */}
            <div className="bg-card/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">Bank-Level Security</h3>
              <p className="text-muted-foreground text-xs">Your data is protected</p>
            </div>

            {/* Simple */}
            <div className="bg-card/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">No Paperwork</h3>
              <p className="text-muted-foreground text-xs">100% digital process</p>
            </div>

            {/* 24/7 */}
            <div className="bg-card/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-border/50">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">24/7 Available</h3>
              <p className="text-muted-foreground text-xs">Apply anytime</p>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="pt-4 pb-4">
            <p className="text-muted-foreground text-xs">
              Licensed by Central Bank of Kenya • CBK/C/123
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-6 py-3">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Landmark className="w-6 h-6" />
            <span className="text-xs">Loans</span>
          </button>
          <button 
            onClick={() => navigate("/auth")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <PiggyBank className="w-6 h-6" />
            <span className="text-xs">Savings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Landing;
