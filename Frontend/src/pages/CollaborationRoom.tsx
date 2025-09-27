import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  MessageCircle,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Pin,
  ThumbsUp,
  ThumbsDown,
  Clock,
  FileText,
  Send
} from "lucide-react";

const CollaborationRoom = () => {
  const [message, setMessage] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);

  const participants = [
    {
      id: "1",
      name: "Dr. Sarah Chen",
      role: "Rheumatologist", 
      avatar: "/placeholder.svg",
      status: "online",
      lastSeen: "now"
    },
    {
      id: "2", 
      name: "Dr. Michael Kim",
      role: "Infectious Disease",
      avatar: "/placeholder.svg",
      status: "online",
      lastSeen: "2 min ago"
    },
    {
      id: "3",
      name: "Dr. Lisa Wang",
      role: "Cardiology", 
      avatar: "/placeholder.svg",
      status: "away",
      lastSeen: "15 min ago"
    },
    {
      id: "4",
      name: "Dr. James Brown",
      role: "Neurology",
      avatar: "/placeholder.svg", 
      status: "offline",
      lastSeen: "1 hour ago"
    }
  ];

  const discussions = [
    {
      id: "disc-001",
      title: "BSG-2024-001: SLE vs MCTD Differential",
      participants: 3,
      messages: 12,
      lastActivity: "5 min ago",
      status: "active",
      priority: "high"
    },
    {
      id: "disc-002", 
      title: "Weekly Case Review - Complex Autoimmune Cases",
      participants: 8,
      messages: 47,
      lastActivity: "1 hour ago",
      status: "scheduled",
      priority: "medium"
    },
    {
      id: "disc-003",
      title: "AI Model Performance Discussion",
      participants: 5,
      messages: 23,
      lastActivity: "3 hours ago", 
      status: "concluded",
      priority: "low"
    }
  ];

  const chatMessages = [
    {
      id: "1",
      sender: "Dr. Sarah Chen",
      message: "Looking at the ANA pattern, the speckled distribution with anti-dsDNA positivity strongly suggests SLE",
      timestamp: "14:32",
      type: "text",
      reactions: { thumbsUp: 2, thumbsDown: 0 }
    },
    {
      id: "2",
      sender: "Dr. Michael Kim", 
      message: "I agree, but we should consider the joint distribution. The lack of erosive changes makes me think about other CTDs",
      timestamp: "14:35",
      type: "text",
      reactions: { thumbsUp: 1, thumbsDown: 0 }
    },
    {
      id: "3",
      sender: "AI Agent",
      message: "New evidence from cardiology specialist: Echo shows mild pericardial effusion, confidence for SLE increased to 89%",
      timestamp: "14:38", 
      type: "ai-update",
      reactions: { thumbsUp: 3, thumbsDown: 0 }
    }
  ];

  const pinnedItems = [
    {
      id: "pin-001",
      type: "case",
      title: "BSG-2024-001 Patient Summary", 
      content: "34F with fever, joint pain, malar rash. ANA 1:640, anti-dsDNA +",
      pinnedBy: "Dr. Sarah Chen",
      timestamp: "2 hours ago"
    },
    {
      id: "pin-002",
      type: "decision",
      title: "Consensus: Order Anti-Sm and Anti-RNP",
      content: "Voted to proceed with additional autoantibody testing before treatment decision",
      pinnedBy: "System",
      timestamp: "1 hour ago"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="ml-6">
            <h1 className="text-xl font-semibold">Collaboration Room</h1>
            <p className="text-sm text-muted-foreground">Multi-disciplinary case discussion and decision making</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button 
                variant={micOn ? "default" : "outline"}
                size="sm"
                onClick={() => setMicOn(!micOn)}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button 
                variant={videoOn ? "default" : "outline"}
                size="sm"
                onClick={() => setVideoOn(!videoOn)}
              >
                {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
            </div>
            <Badge variant="outline" className="bg-success text-success-foreground">
              <Users className="mr-1 h-3 w-3" />
              {participants.filter(p => p.status === 'online').length} Online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Participants & Discussions */}
          <div className="space-y-6">
            
            {/* Active Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-4 w-4" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{participant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          participant.status === 'online' ? 'bg-success' :
                          participant.status === 'away' ? 'bg-warning' :
                          'bg-muted-foreground'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{participant.name}</div>
                        <div className="text-xs text-muted-foreground">{participant.role}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {participant.lastSeen}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Discussions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discussions.map((discussion) => (
                    <div key={discussion.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      discussion.status === 'active' ? 'bg-accent-muted border border-accent' : 'bg-muted hover:bg-muted/80'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">{discussion.title}</h4>
                          <Badge variant={
                            discussion.priority === 'high' ? 'destructive' :
                            discussion.priority === 'medium' ? 'default' :
                            'secondary'
                          } className="ml-2">
                            {discussion.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{discussion.participants} participants • {discussion.messages} messages</span>
                          <span className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {discussion.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Chat Header */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>BSG-2024-001: SLE vs MCTD Differential</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Summary
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Chat Messages */}
            <Card className="flex-1">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex space-x-3 ${
                      msg.type === 'ai-update' ? 'bg-accent-muted p-3 rounded-lg' : ''
                    }`}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>
                          {msg.sender === 'AI Agent' ? 'AI' : msg.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{msg.sender}</span>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          {msg.type === 'ai-update' && (
                            <Badge variant="outline" className="bg-primary text-primary-foreground">
                              AI Update
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{msg.message}</p>
                        <div className="flex items-center space-x-4 text-xs">
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-success">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{msg.reactions.thumbsUp}</span>
                          </button>
                          <button className="flex items-center space-x-1 text-muted-foreground hover:text-destructive">
                            <ThumbsDown className="h-3 w-3" />
                            <span>{msg.reactions.thumbsDown}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 min-h-[60px] resize-none"
                    />
                    <div className="flex flex-col space-y-2">
                      <Button size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Pinned Items & Decision Log */}
          <div className="space-y-6">
            
            {/* Pinned Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Pin className="mr-2 h-4 w-4" />
                  Pinned Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pinnedItems.map((item) => (
                    <div key={item.id} className="p-3 bg-muted rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <Badge variant="outline" className="ml-2">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.content}</p>
                        <div className="text-xs text-muted-foreground">
                          Pinned by {item.pinnedBy} • {item.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Decision Voting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Vote</CardTitle>
                <CardDescription>Next steps for BSG-2024-001</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Order Anti-Sm & Anti-RNP</span>
                      <span className="font-medium">3 votes</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Start Empiric Treatment</span>
                      <span className="font-medium">1 vote</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-warning h-2 rounded-full" style={{width: '25%'}}></div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button className="w-full" size="sm">
                      Cast Your Vote
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Export Discussion
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Invite Specialist
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Schedule Follow-up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationRoom;