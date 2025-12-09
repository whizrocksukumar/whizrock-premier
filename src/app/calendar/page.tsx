import Image from "next/image";

export default function CalendarDemoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
        <p className="text-yellow-800 text-sm font-medium">
          This is a demo page. Your calendar will be synced with Outlook or Gmail, 
          and your live installation schedule will appear here.
        </p>
      </div>

      <div className="w-full flex justify-center">
        <Image 
          src="/calendar.png"
          alt="Calendar Demo"
          width={1600}
          height={900}
          className="rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
