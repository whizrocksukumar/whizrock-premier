import Link from 'next/link'
import { Book, FileText, Briefcase, AlertCircle, Package, Clock, Users, Settings, ArrowRight } from 'lucide-react'

export default function HelpPage() {
  const sections = [
    {
      title: 'Quotes',
      icon: FileText,
      href: '/help/quotes',
      color: 'blue',
      description: 'Learn how to create, manage, and send quotes to customers',
      topics: [
        'Creating a new quote',
        'Adding products and services',
        'Sending quotes to customers',
        'Converting quotes to jobs'
      ]
    },
    {
      title: 'Jobs',
      icon: Briefcase,
      href: '/help/jobs',
      color: 'green',
      description: 'Manage jobs from start to completion',
      topics: [
        'Creating jobs from quotes',
        'Scheduling and assigning work',
        'Tracking progress',
        'Generating completion certificates'
      ]
    },
    {
      title: 'Incidents',
      icon: AlertCircle,
      href: '/help/incidents',
      color: 'red',
      description: 'Report and track job-related incidents',
      topics: [
        'Reporting an incident',
        'Adding photos and notes',
        'Tracking resolution',
        'Closing incidents'
      ]
    },
    {
      title: 'Inventory',
      icon: Package,
      href: '/help/inventory',
      color: 'purple',
      description: 'Monitor and manage stock levels',
      topics: [
        'Checking stock levels',
        'Understanding alerts',
        'Adjusting quantities',
        'Viewing movement history'
      ]
    }
  ]

  const quickLinks = [
    { title: 'Dashboard Overview', icon: Clock, href: '/help#dashboard' },
    { title: 'User Roles & Permissions', icon: Users, href: '/help#roles' },
    { title: 'System Settings', icon: Settings, href: '/help#settings' }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'green':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'red':
        return 'bg-red-100 text-red-600 border-red-200'
      case 'purple':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Book className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Documentation</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome to Premier Insulation's help center. Find guides, tutorials, and answers to common questions.
          </p>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border ${getColorClasses(section.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-between">
                      {section.title}
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                    <ul className="space-y-1">
                      {section.topics.map((topic, index) => (
                        <li key={index} className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{link.title}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-white rounded-lg shadow-md p-8" id="dashboard">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dashboard Overview</h3>
              <p className="text-gray-600 mb-3">
                Your dashboard provides a quick overview of your business activities. Here's what you'll see:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Summary Cards</strong> - Quick stats on quotes, jobs, revenue, and upcoming assessments</span>
                </li>
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Recent Activity</strong> - Latest quotes, jobs, and system updates</span>
                </li>
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Navigation Menu</strong> - Access all system features from the left sidebar</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
              <p className="text-gray-600 mb-3">
                Use the main menu to navigate between different sections:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">📋 Quotes</p>
                  <p className="text-xs text-gray-600">Create and manage customer quotes</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">💼 Jobs</p>
                  <p className="text-xs text-gray-600">Track installation work</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">⚠️ Incidents</p>
                  <p className="text-xs text-gray-600">Report and track issues</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">📦 Inventory</p>
                  <p className="text-xs text-gray-600">Manage stock levels</p>
                </div>
              </div>
            </div>

            <div id="roles">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">User Roles</h3>
              <p className="text-gray-600 mb-3">
                Different team members have different access levels:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Admin</strong> - Full access to all features and settings</span>
                </li>
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Office Staff</strong> - Create quotes, manage jobs, handle customer communications</span>
                </li>
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Installer</strong> - View assigned jobs, update progress, report incidents</span>
                </li>
                <li className="text-gray-600 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></span>
                  <span><strong>Warehouse</strong> - Manage inventory, adjust stock levels</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 inline-block">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Still need help?</h3>
            <p className="text-blue-700 mb-4">Our support team is here to assist you</p>
            <a
              href="mailto:support@premierinsulation.co.nz"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
