import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAILS = ['marcuscrowell44@gmail.com', 'marcus@play44sports.com', 'marcus@cdmweb.store', 'marcus_crowell@yahoo.com', 'marcus@zapai.io'];

const Header = () => {
  const { user, signOut, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

      const userEmail = user.email.toLowerCase();
      if (ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail)) {
        setIsAdmin(true);
        return;
      }

      const { data } = await supabase
        .from('admin_users')
        .select('is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      setIsAdmin(!!data);
    };

    checkAdmin();
  }, [user]);

  return (
    <header className="w-full p-4 bg-leather/80 backdrop-blur-sm flex justify-between items-center rounded-b-lg">
      <div className="flex-1" />
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-wide">
          <span className="text-gold font-western italic">Leads 2 Gold</span>
        </h1>
        <p className="text-dust text-lg sm:text-xl font-body mt-2">
          Strike It Rich with Quality Prospects
        </p>
      </div>
      <div className="flex-1 flex justify-end gap-2">
        {!isLoading && (
          user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-dust hover:text-gold">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <span className="text-dust text-sm hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-dust hover:text-gold">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-dust hover:text-gold">
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
