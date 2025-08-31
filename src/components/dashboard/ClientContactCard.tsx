import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { User, Mail, Phone, Globe, MapPin, Building } from "lucide-react";

export const ClientContactCard = () => {
  const { profile, loading, error, updateProfile } = useClientProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  const startEditing = () => {
    setFormData({
      business_name: profile?.business_name || '',
      contact_name: profile?.contact_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      address: profile?.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your contact information has been saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      business_name: '',
      contact_name: '',
      email: '',
      phone: '',
      website: '',
      address: '',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading profile: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Contact Information
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="Your Name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@business.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Business address"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {profile?.business_name && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{profile.business_name}</span>
              </div>
            )}
            {profile?.contact_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contact_name}</span>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile?.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
            {profile?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.address}</span>
              </div>
            )}
            {!profile && (
              <p className="text-muted-foreground text-sm">
                No contact information available. Click Edit to add your details.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};