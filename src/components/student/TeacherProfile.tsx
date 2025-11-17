import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Star, MapPin, Clock, DollarSign, Calendar, Award, MessageSquare, Heart, ArrowLeft } from 'lucide-react';

interface TeacherProfileProps {
  teacher: any;
  onBack: () => void;
  onBookSession: () => void;
}

export function TeacherProfile({ teacher, onBack, onBookSession }: TeacherProfileProps) {
  const [selectedTab, setSelectedTab] = useState('about');

  if (!teacher) {
    return <div>No teacher selected</div>;
  }

  const reviews = [
    {
      id: 1,
      student: 'Alex M.',
      rating: 5,
      comment: 'Excellent teacher! Very patient and explains concepts clearly.',
      date: '2 weeks ago',
      subject: 'Calculus'
    },
    {
      id: 2,
      student: 'Sarah K.',
      rating: 5,
      comment: 'Helped me improve my grades significantly. Highly recommended!',
      date: '1 month ago',
      subject: 'Algebra'
    },
    {
      id: 3,
      student: 'Mike R.',
      rating: 4,
      comment: 'Great teaching style, very organized lessons.',
      date: '1 month ago',
      subject: 'Statistics'
    }
  ];

  const availability = [
    { day: 'Monday', slots: ['9:00 AM', '2:00 PM', '4:00 PM'] },
    { day: 'Tuesday', slots: ['10:00 AM', '1:00 PM'] },
    { day: 'Wednesday', slots: ['9:00 AM', '3:00 PM', '5:00 PM'] },
    { day: 'Thursday', slots: ['11:00 AM', '2:00 PM'] },
    { day: 'Friday', slots: ['9:00 AM', '1:00 PM', '4:00 PM'] },
    { day: 'Saturday', slots: ['10:00 AM', '2:00 PM'] },
    { day: 'Sunday', slots: [] }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Teacher Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <img
                  src={teacher.image}
                  alt={teacher.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                {teacher.verified && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{teacher.name}</h2>
                    <p className="text-lg text-slate-600 mb-2">{teacher.subject} Teacher</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{teacher.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4" />
                        <span>{teacher.experience}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 mb-4">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">{teacher.rating}</span>
                      <span className="text-slate-500">({teacher.reviews} reviews)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${teacher.hourlyRate}</div>
                    <div className="text-sm text-slate-500">per hour</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {teacher.specialties.map((specialty: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button className="bg-blue-500 hover:bg-blue-600" onClick={onBookSession}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Send request
                  </Button>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">About Me</h3>
                <div className="space-y-4 text-slate-700">
                  <p>
                    I'm a passionate {teacher.subject.toLowerCase()} educator with over 8 years of experience helping students 
                    achieve their academic goals. I hold a Ph.D. in Mathematics from MIT and have taught at both 
                    university and high school levels.
                  </p>
                  <p>
                    My teaching philosophy centers on making complex concepts accessible and engaging. I believe 
                    every student can excel in mathematics with the right guidance and support. I use a variety of 
                    teaching methods to accommodate different learning styles.
                  </p>
                  <p>
                    I specialize in {teacher.specialties.join(', ')} and have helped hundreds of students improve 
                    their grades and confidence in mathematics. Whether you're struggling with basic concepts or 
                    preparing for advanced examinations, I'm here to help you succeed.
                  </p>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Teaching Approach</h4>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Personalized lesson plans based on student needs</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Interactive problem-solving sessions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Regular progress assessments and feedback</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Homework support and study strategies</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Student Reviews</h3>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{teacher.rating}</span>
                    <span className="text-slate-500">({teacher.reviews} reviews)</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.student}</span>
                            <Badge variant="outline" className="text-xs">{review.subject}</Badge>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">{review.date}</span>
                      </div>
                      <p className="text-slate-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Available Time Slots</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availability.map((day) => (
                    <div key={day.day} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{day.day}</h4>
                      {day.slots.length > 0 ? (
                        <div className="space-y-2">
                          {day.slots.map((slot, index) => (
                            <Button key={index} variant="outline" size="sm" className="w-full">
                              {slot}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">No available slots</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Qualifications & Achievements</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-yellow-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Ph.D. in Mathematics</h4>
                      <p className="text-sm text-slate-600">Massachusetts Institute of Technology (MIT)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Certified Math Teacher</h4>
                      <p className="text-sm text-slate-600">State Board Certification</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Excellence in Teaching Award</h4>
                      <p className="text-sm text-slate-600">2023 - Regional Education Board</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h4 className="font-medium">Published Research</h4>
                      <p className="text-sm text-slate-600">15+ papers in peer-reviewed journals</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Students</span>
                <span className="font-medium">147</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-medium text-green-600">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Response Time</span>
                <span className="font-medium">&lt; 2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Languages</span>
                <span className="font-medium">English, Spanish</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Last active 2 hours ago</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>3 new students this week</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>5-star review received</span>
              </div>
            </div>
          </Card>

          {/* Contact Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Get Started</h3>
            <div className="space-y-3">
              <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={onBookSession}>
                <Calendar className="h-4 w-4 mr-2" />
                Send request
              </Button>
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <p className="text-xs text-slate-500 text-center">
                First 30 minutes consultation is free!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}