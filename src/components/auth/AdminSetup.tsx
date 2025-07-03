import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";

export const AdminSetup = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAdminUser = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // First create the admin user through signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'Admin@123',
        options: {
          data: {
            full_name: 'Super Admin'
          }
        }
      });

      if (signupError) {
        throw signupError;
      }

      // If user was created successfully, update their profile to admin role
      if (signupData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            full_name: 'Super Admin',
            is_active: true 
          })
          .eq('id', signupData.user.id);

        if (updateError) {
          console.warn('Could not update profile role:', updateError);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Admin creation error:', err);
      setError(err.message || 'Failed to create admin user');
    } finally {
      setIsCreating(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-green-800">Admin User Created</CardTitle>
          <CardDescription>
            Super Admin account has been successfully created!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> admin@example.com</p>
            <p><strong>Password:</strong> Admin@123</p>
            <Alert>
              <AlertDescription>
                You can now sign in with these credentials. Please change the password after your first login.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Create Super Admin</CardTitle>
        <CardDescription>
          Set up the initial administrator account for the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <p><strong>Admin Credentials:</strong></p>
            <p>Email: admin@example.com</p>
            <p>Password: Admin@123</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={createAdminUser} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Admin...
              </>
            ) : (
              'Create Super Admin Account'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};