"use client"

import { useState, useEffect, useRef } from "react"

interface FeatureCardProps {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}

function FeatureCard({ title, description, isActive, progress, onClick }: FeatureCardProps) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-l-0 border-r-0 md:border border-[#E0DEDB]/80"
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#322D2B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#605A57] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}

export default function FeatureCarousel() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <>
      {/* Dashboard Preview */}
      <div className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
        <div className="w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start">
          <div className="self-stretch flex-1 flex justify-start items-start">
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full overflow-hidden">
                {/* Product Image 1 */}
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dsadsadsa.jpg-xTHS4hGwCWp2H5bTj8np6DXZUyrxX7.jpeg"
                    alt="Schedules Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Image 2 */}
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <img
                    src="/analytics-dashboard-with-charts-graphs-and-data-vi.jpg"
                    alt="Analytics Dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Image 3 */}
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    activeCard === 2 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                  }`}
                >
                  <img
                    src="/data-visualization-dashboard-with-interactive-char.jpg"
                    alt="Data Visualization Dashboard"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              ></div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
          <FeatureCard
            title="Plan your schedules"
            description="Streamline customer subscriptions and billing with automated scheduling tools."
            isActive={activeCard === 0}
            progress={activeCard === 0 ? progress : 0}
            onClick={() => handleCardClick(0)}
          />
          <FeatureCard
            title="Analytics & insights"
            description="Transform your business data into actionable insights with real-time analytics."
            isActive={activeCard === 1}
            progress={activeCard === 1 ? progress : 0}
            onClick={() => handleCardClick(1)}
          />
          <FeatureCard
            title="Collaborate seamlessly"
            description="Keep your team aligned with shared dashboards and collaborative workflows."
            isActive={activeCard === 2}
            progress={activeCard === 2 ? progress : 0}
            onClick={() => handleCardClick(2)}
          />
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
