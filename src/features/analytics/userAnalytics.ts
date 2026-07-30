export interface UserEvent {
  event: string;
  timestamp: Date;
}

const events: UserEvent[] = [];

export function trackEvent(event:string) {

  events.push({
    event,
    timestamp:new Date()
  });

}

export function getEvents(){
  return events;
}