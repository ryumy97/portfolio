export function getLocation() {
    console.log(window.location.hash)
    const location = window.location.hash.replace(/\#\//i, '');
    return location;
}

export function setLocation(loc) {
    window.history.pushState({},`Ryumy - ${loc}`, loc);
}

export const pages = ['title', 'experiences', 'projects', 'contact'];

export function getContext() {
    const location = getLocation();
    switch (location) {
        case 'experiences': {
            return {
                pageName: 'experiences',
                title: 'Experiences',
                isTitle: false,
                isLast: false,
                nextContext: 'projects',
                prevContext: '',
            }
        }
        case 'projects': {
            return {
                pageName: 'projects',
                title: 'Projects',
                isTitle: false,
                isLast: false,
                nextContext: 'contact',
                prevContext: 'experiences',
            }
        }
        case 'contact': {
            return {
                pageName: 'contact',
                title: 'Ryumy',
                isTitle: false,
                isLast: true,
                nextContext: '',
                prevContext: 'projects',
            }
        }
        default:
            return {
                pageName: 'title',
                title: 'Ryumy',
                isTitle: true,
                isLast: false,
                nextContext: 'experiences',
                prevContext: '',
            }
    }
}