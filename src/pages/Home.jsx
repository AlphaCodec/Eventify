import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, Users, Star, ArrowRight, Zap } from 'lucide-react';
import { eventsData } from '../data/eventsData';
import EventCard from '../components/EventCard';
import { motion } from 'framer-motion';

function Home() {
  const featuredEvents = eventsData.filter(event => event.featured).slice(0, 3);

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap className="h-4 w-4" />
                <span>Your Event Journey Starts Here</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
                Discover Amazing
                <span className="text-primary-600"> Events</span> Near You
              </h1>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Join thousands of people discovering and attending incredible events. From concerts to conferences, find experiences that inspire and connect you.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/events"
                  className="group bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition-all duration-300 font-semibold inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Explore Events
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/create-event"
                  className="bg-white text-neutral-900 px-8 py-4 rounded-xl hover:bg-neutral-50 transition-colors font-semibold border-2 border-neutral-200"
                >
                  Create Event
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800" 
                alt="Events"
                className="rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">10K+</p>
                    <p className="text-sm text-neutral-600">Active Users</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Featured Events</h2>
            <p className="text-lg text-neutral-600">Don't miss out on these amazing experiences</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="text-center">
            <Link 
              to="/events"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg"
            >
              View All Events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Why Choose Eventify?</h2>
            <p className="text-lg text-neutral-600">Everything you need for amazing event experiences</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Search className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Easy Discovery</h3>
              <p className="text-neutral-600">
                Find events that match your interests with our powerful search and filtering tools.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="bg-accent-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="h-7 w-7 text-accent-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Seamless Booking</h3>
              <p className="text-neutral-600">
                Book tickets instantly with our secure and user-friendly booking system.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="bg-primary-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Star className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">Premium Experience</h3>
              <p className="text-neutral-600">
                Enjoy curated events from trusted organizers with excellent reviews and ratings.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
