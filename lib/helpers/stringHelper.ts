export const sanitize = (str: string): string => {
    return str.split("'").join("''");
}