function formatToLocalDDMMYYHM(input: string): string {
    const date = new Date(input);
  
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date input");
    }
  
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const yy = String(date.getFullYear()).slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // Convert 0 to 12
    const hh = String(hours).padStart(2, '0');

    return `${dd}-${mm}-${yy} ${hh}:${minutes} ${ampm}`;
}

export {
    formatToLocalDDMMYYHM
}