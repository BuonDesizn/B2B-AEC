-- Enable realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime on connections table
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
