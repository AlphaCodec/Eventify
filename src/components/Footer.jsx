import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">Eventify</span>
            </div>
            <p className="text-neutral-400 text-sm">
              Your ultimate platform for discovering and creating amazing events.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">Browse Events</Link></li>
              <li><Link to="/create-event" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">Create Event</Link></li>
              <li><Link to="/about" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-primary-500 text-sm transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col md:flex-row justify-center items-center gap-2 text-sm text-neutral-500">
          <p className="text-center">
            AI vibe coded development by{' '}
            <a href="https://biela.dev/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 transition-colors">
              Biela.dev
            </a>
            , powered by{' '}
            <a href="https://teachmecode.ae/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 transition-colors">
              TeachMeCode® Institute
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
