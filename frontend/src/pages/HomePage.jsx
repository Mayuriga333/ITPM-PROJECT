import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Clock, Star } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-slate-50 mb-4">
          TutorConnect
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Connect with peer volunteers for academic support. Learn together, grow together.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link to="/discovery" className="btn-primary text-lg px-8 py-3">
            Browse Volunteers
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="text-center card-soft p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-500/15 border border-blue-500/50">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-50">Peer Volunteers</h3>
          <p className="text-slate-400">Connect with fellow students who excel in their subjects</p>
        </div>
        <div className="text-center card-soft p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-500/15 border border-blue-500/50">
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-50">Flexible Scheduling</h3>
          <p className="text-slate-400">Choose times that work for you</p>
        </div>
        <div className="text-center card-soft p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-500/15 border border-blue-500/50">
            <Star className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-50">Rated Volunteers</h3>
          <p className="text-slate-400">Learn from top-rated peer tutors</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="card-surface p-12 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-50 mb-4">
          Ready to start learning?
        </h2>
        <p className="text-lg text-slate-300 mb-8">
          Join our community of learners and volunteers today.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/discovery" className="btn-primary px-8 py-3">
            Browse Tutors
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;