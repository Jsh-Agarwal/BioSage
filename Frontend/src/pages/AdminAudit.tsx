import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Shield,
  Search,
  Download,
  Filter,
  Clock,
  User,
  FileText,
  Eye,
  Lock,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";

const AdminAudit = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const auditLogs = [
    {
      id: "audit-001",
      timestamp: "2024-01-18 14:32:15",
      userId: "dr.chen@hospital.com",
      userName: "Dr. Sarah Chen",
      action: "Case Diagnosis Accepted",
      resource: "BSG-2024-001",
      details: "Accepted AI recommendation: Systemic Lupus (87% confidence)",
      ipAddress: "10.15.42.101",
      userAgent: "Chrome 120.0.6099.129",
      severity: "info",
      compliance: "HIPAA"
    },
    {
      id: "audit-002", 
      timestamp: "2024-01-18 14:28:43",
      userId: "dr.kim@hospital.com",
      userName: "Dr. Michael Kim",
      action: "Patient Data Access",
      resource: "Patient MRN-789123",
      details: "Viewed full patient summary and medical history",
      ipAddress: "10.15.42.89",
      userAgent: "Chrome 120.0.6099.129", 
      severity: "info",
      compliance: "HIPAA"
    },
    {
      id: "audit-003",
      timestamp: "2024-01-18 14:25:17",
      userId: "system@biosage.ai",
      userName: "BioSage AI System", 
      action: "Model Prediction Generated",
      resource: "BSG-2024-001",
      details: "Integrator model v3.2.1 generated differential diagnosis with 87% confidence",
      ipAddress: "172.16.0.45",
      userAgent: "BioSage-Agent/3.2.1",
      severity: "info",
      compliance: "FDA-510k"
    },
    {
      id: "audit-004",
      timestamp: "2024-01-18 13:15:09",
      userId: "admin@hospital.com",
      userName: "System Administrator",
      action: "User Permission Modified", 
      resource: "User: dr.wang@hospital.com",
      details: "Granted access to Cardiology specialist module",
      ipAddress: "10.15.42.200",
      userAgent: "Firefox 121.0.1",
      severity: "warning",
      compliance: "SOC2"
    },
    {
      id: "audit-005",
      timestamp: "2024-01-18 12:45:33",
      userId: "dr.brown@hospital.com", 
      userName: "Dr. James Brown",
      action: "Failed Login Attempt",
      resource: "Authentication System",
      details: "Invalid password - account temporarily locked after 3 attempts",
      ipAddress: "203.45.67.89",
      userAgent: "Safari 17.2.1",
      severity: "critical",
      compliance: "HIPAA"
    },
    {
      id: "audit-006",
      timestamp: "2024-01-18 11:30:22",
      userId: "compliance@hospital.com",
      userName: "Compliance Officer",
      action: "Audit Report Generated",
      resource: "Monthly Compliance Report",
      details: "Generated comprehensive audit report for January 2024", 
      ipAddress: "10.15.42.150",
      userAgent: "Chrome 120.0.6099.129",
      severity: "info",
      compliance: "SOC2"
    }
  ];

  const systemEvents = [
    {
      id: "sys-001",
      timestamp: "2024-01-18 15:00:00",
      event: "Automated Backup Completed",
      status: "success",
      details: "Full system backup completed successfully - 2.3TB backed up to secure cloud storage",
      duration: "45 minutes"
    },
    {
      id: "sys-002",
      timestamp: "2024-01-18 14:45:12", 
      event: "Model Drift Alert",
      status: "warning",
      details: "Infectious Disease model showing 8% confidence decrease over 48 hours",
      duration: "N/A"
    },
    {
      id: "sys-003",
      timestamp: "2024-01-18 13:30:00",
      event: "Database Maintenance",
      status: "success", 
      details: "Routine database optimization and index rebuilding completed",
      duration: "15 minutes"
    },
    {
      id: "sys-004",
      timestamp: "2024-01-18 12:00:00",
      event: "Security Scan",
      status: "success",
      details: "Automated vulnerability assessment - no critical issues detected",
      duration: "30 minutes"
    }
  ];

  const complianceMetrics = {
    hipaa: {
      status: "compliant",
      lastAudit: "2024-01-15",
      score: 98.5,
      issues: 0
    },
    fda: {
      status: "compliant", 
      lastAudit: "2024-01-10",
      score: 97.2,
      issues: 1
    },
    soc2: {
      status: "compliant",
      lastAudit: "2024-01-08", 
      score: 99.1,
      issues: 0
    },
    gdpr: {
      status: "compliant",
      lastAudit: "2024-01-12",
      score: 96.8,
      issues: 2
    }
  };

  const userActivity = [
    { user: "Dr. Sarah Chen", lastLogin: "2024-01-18 14:30", actions: 23, riskScore: "Low" },
    { user: "Dr. Michael Kim", lastLogin: "2024-01-18 14:25", actions: 18, riskScore: "Low" },
    { user: "Dr. Lisa Wang", lastLogin: "2024-01-18 13:15", actions: 12, riskScore: "Low" }, 
    { user: "Dr. James Brown", lastLogin: "2024-01-17 16:45", actions: 5, riskScore: "Medium" },
    { user: "System Admin", lastLogin: "2024-01-18 13:10", actions: 8, riskScore: "Low" }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || log.severity === filterType;
    return matchesSearch && matchesFilter;
  });

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
            <h1 className="text-xl font-semibold">Admin & Audit Logs</h1>
            <p className="text-sm text-muted-foreground">System administration and regulatory compliance monitoring</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-success text-success-foreground">
              <Shield className="mr-1 h-3 w-3" />
              All Systems Secure
            </Badge>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        
        {/* Compliance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Compliance Status Overview
            </CardTitle>
            <CardDescription>Current regulatory compliance and audit status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(complianceMetrics).map(([key, metric]) => (
                <div key={key} className="text-center p-4 border rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg uppercase">{key}</h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      metric.status === 'compliant' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                    }`}>
                      {metric.status === 'compliant' ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
                      {metric.status}
                    </div>
                    <div className="text-2xl font-bold text-primary">{metric.score}%</div>
                    <div className="text-xs text-muted-foreground">Last audit: {metric.lastAudit}</div>
                    {metric.issues > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {metric.issues} open issues
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="audit-logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="system-events">System Events</TabsTrigger>
            <TabsTrigger value="user-activity">User Activity</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="space-y-6">
            
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Severity</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Audit Log Entries ({filteredLogs.length})</span>
                  <Badge variant="outline">Real-time monitoring</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <Card key={log.id} className={`border-l-4 ${
                      log.severity === 'critical' ? 'border-l-destructive' :
                      log.severity === 'warning' ? 'border-l-warning' :
                      'border-l-info'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{log.action}</h3>
                              <Badge variant={
                                log.severity === 'critical' ? 'destructive' :
                                log.severity === 'warning' ? 'default' :
                                'secondary'
                              }>
                                {log.severity}
                              </Badge>
                              <Badge variant="outline">{log.compliance}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">User: </span>
                                <span className="font-medium">{log.userName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Resource: </span>
                                <span className="font-medium">{log.resource}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IP: </span>
                                <span className="font-medium">{log.ipAddress}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                            
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="mr-1 h-3 w-3" />
                                {log.timestamp}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Details
                                </Button>
                                {log.severity === 'critical' && (
                                  <Button size="sm">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Investigate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Events Tab */}
          <TabsContent value="system-events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  System Events & Monitoring
                </CardTitle>
                <CardDescription>Automated system processes and health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{event.event}</h3>
                          <Badge variant={
                            event.status === 'success' ? 'secondary' :
                            event.status === 'warning' ? 'default' :
                            'destructive'
                          } className={
                            event.status === 'success' ? 'bg-success' :
                            event.status === 'warning' ? 'bg-warning' :
                            ''
                          }>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.details}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          {event.timestamp} • Duration: {event.duration}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Logs
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="user-activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  User Activity Monitoring
                </CardTitle>
                <CardDescription>Track user access patterns and risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userActivity.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{user.user}</h3>
                        <div className="text-sm text-muted-foreground">
                          Last login: {user.lastLogin}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-semibold">{user.actions}</div>
                          <div className="text-xs text-muted-foreground">Actions today</div>
                        </div>
                        <Badge variant={
                          user.riskScore === 'Low' ? 'secondary' :
                          user.riskScore === 'Medium' ? 'default' :
                          'destructive'
                        } className={
                          user.riskScore === 'Low' ? 'bg-success' :
                          user.riskScore === 'Medium' ? 'bg-warning' :
                          ''
                        }>
                          {user.riskScore} Risk
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Activity
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Reports Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Available Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "HIPAA Compliance Report", date: "2024-01-15", status: "Current" },
                      { name: "FDA 510(k) Audit Trail", date: "2024-01-10", status: "Current" },
                      { name: "SOC 2 Type II Report", date: "2024-01-08", status: "Current" },
                      { name: "GDPR Data Processing Record", date: "2024-01-12", status: "Current" },
                      { name: "Security Vulnerability Assessment", date: "2024-01-18", status: "New" }
                    ].map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{report.name}</div>
                          <div className="text-xs text-muted-foreground">Generated: {report.date}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={report.status === 'New' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="mr-2 h-5 w-5" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <CheckCircle className="mx-auto h-8 w-8 text-success mb-2" />
                      <div className="font-semibold text-success">Security Score: 98.5%</div>
                      <div className="text-sm text-muted-foreground">Last scan: 2 hours ago</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Access Controls</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Encryption</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Network Security</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Backup Systems</span>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Vulnerability Management</span>
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAudit;