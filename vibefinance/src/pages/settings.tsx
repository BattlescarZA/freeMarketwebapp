import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { User, Bell, DollarSign, Shield, Database, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    title: 'Profile',
    description: 'Update your personal information',
    fields: [
      { id: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
    ],
  },
  {
    id: 'preferences',
    icon: DollarSign,
    title: 'Preferences',
    description: 'Customize your experience',
    content: (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
          <div>
            <Label className="text-base font-medium">Theme</Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Input id="currency" value="USD" disabled className="bg-muted/50" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Configure notification preferences',
    notifications: [
      { id: 'price-alerts', label: 'Price Alerts', description: 'Get notified when assets reach target prices' },
      { id: 'portfolio-updates', label: 'Portfolio Updates', description: 'Daily summary of portfolio performance' },
      { id: 'market-news', label: 'Market News', description: 'Important market events and news' },
      { id: 'security-alerts', label: 'Security Alerts', description: 'Login and security notifications' },
    ],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Manage your account security',
    fields: [
      { id: 'current-password', label: 'Current Password', type: 'password', placeholder: 'Enter current password' },
      { id: 'new-password', label: 'New Password', type: 'password', placeholder: 'Enter new password' },
      { id: 'confirm-password', label: 'Confirm Password', type: 'password', placeholder: 'Confirm new password' },
    ],
  },
  {
    id: 'data',
    icon: Database,
    title: 'Data & Privacy',
    description: 'Manage your data and privacy settings',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your portfolio data
              </p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    ),
  },
];

export function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            
            return (
              <Card 
                key={section.id}
                className={cn(
                  "overflow-hidden",
                  section.id === 'data' && "border-destructive/20"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      section.id === 'data' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-primary/10 text-primary'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {section.fields && (
                    <form className="space-y-4">
                      <div className={cn(
                        "grid gap-4",
                        section.fields.length > 2 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                      )}>
                        {section.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            <Input
                              id={field.id}
                              type={field.type}
                              placeholder={field.placeholder}
                              className={field.type === 'password' ? 'font-mono' : ''}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button size="sm">
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  )}
                  
                  {section.notifications && (
                    <div className="space-y-3">
                      {section.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                        >
                          <div>
                            <Label className="text-sm font-medium">{notification.label}</Label>
                            <p className="text-xs text-muted-foreground">
                              {notification.description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer" aria-label={`Toggle ${notification.label}`}>
                            <input type="checkbox" className="sr-only peer" aria-label={`Enable ${notification.label}`} />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {section.content}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
