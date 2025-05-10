export const createKolkataTime = (minutesToAdd = 0) => {
    const date = new Date();
    
    const offset = 5.5 * 60 * 60 * 1000;
  
    const kolkataDate = new Date(date.getTime() + offset + minutesToAdd * 60 * 1000);
    
    return kolkataDate.toISOString();
  };