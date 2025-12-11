import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Users, RefreshCw, Database, Settings } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface RoleMigrationPanelProps {
  onComplete?: () => void;
}

export const RoleMigrationPanel: React.FC<RoleMigrationPanelProps> = ({ onComplete }) => {
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [isRunningSync, setIsRunningSync] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    setIsRunningMigration(true);
    setMigrationResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMigrationResult('✅ Migration completed successfully');
        toast({
          title: "Migration Complete",
          description: "All user roles have been updated to the new system",
        });
      } else {
        throw new Error(data.error || 'Migration failed');
      }
    } catch (error: any) {
      setMigrationResult(`❌ Migration failed: ${error.message}`);
      toast({
        title: "Migration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningMigration(false);
    }
  };

  const runSync = async () => {
    setIsRunningSync(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/admin/sync-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncResult('✅ Metadata sync completed successfully');
        toast({
          title: "Sync Complete",
          description: "Supabase Auth metadata has been synchronized",
        });
        if (onComplete) onComplete();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error: any) {
      setSyncResult(`❌ Sync failed: ${error.message}`);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningSync(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="role-migration-panel">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Migration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Role Migration
            </CardTitle>
            <CardDescription>
              Update existing users to the new 3-tier role system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Super Admin</Badge>
                <span className="text-sm text-muted-foreground">
                  dean@, victor@, samuel@
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">WL User</Badge>
                <span className="text-sm text-muted-foreground">
                  All existing users (full CRM access)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Regular User</Badge>
                <span className="text-sm text-muted-foreground">
                  New users (core CRM only)
                </span>
              </div>
            </div>
            
            <Button 
              onClick={runMigration}
              disabled={isRunningMigration}
              className="w-full"
              data-testid="button-run-migration"
            >
              {isRunningMigration ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Run Role Migration
                </>
              )}
            </Button>
            
            {migrationResult && (
              <div className={`p-3 rounded-lg text-sm ${
                migrationResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {migrationResult}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Metadata Sync
            </CardTitle>
            <CardDescription>
              Synchronize role data with Supabase Auth metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Updates Supabase Auth user_metadata</p>
              <p>• Ensures email template routing</p>
              <p>• Syncs role information for consistency</p>
            </div>
            
            <Button 
              onClick={runSync}
              disabled={isRunningSync}
              className="w-full"
              variant="outline"
              data-testid="button-run-sync"
            >
              {isRunningSync ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing Metadata...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Metadata
                </>
              )}
            </Button>
            
            {syncResult && (
              <div className={`p-3 rounded-lg text-sm ${
                syncResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {syncResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Migration Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">1.</span>
              <p>
                <strong>Run Role Migration first:</strong> Updates all existing users in your database to the correct roles (Super Admin for dean@, victor@, samuel@ and WL User for everyone else).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">2.</span>
              <p>
                <strong>Run Metadata Sync:</strong> Synchronizes the role information with Supabase Auth to ensure proper email template routing and consistent data.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 mt-0.5">3.</span>
              <p>
                <strong>Future invites:</strong> When inviting new users, they'll be assigned roles properly and get the correct email templates automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};