export type Dropzone = {
    name: string;
    fixedLandingDirections?: number[];
    mapPath: string;
    width: number;
    height: number;
    metersPerPixel: number;
};

const dropzones: [Dropzone, ...Dropzone[]] = [
    {
        name: "Vårgårda",
        fixedLandingDirections: [40, 220],
        mapPath: "/maps/vargarda.png",
        width: 1436,
        height: 1000,
        metersPerPixel: 5,
    },
    {
        name: "Näsinge",
        fixedLandingDirections: [30, 210],
        mapPath: "/maps/nasinge.png",
        width: 1436,
        height: 1000,
        metersPerPixel: 5,
    },
    {
        name: "Skövde",
        fixedLandingDirections: [10, 190],
        mapPath: "/maps/skovde.png",
        width: 1436,
        height: 1000,
        metersPerPixel: 5,
    },
    {
        name: "Koster",
        mapPath: "/maps/koster.png",
        width: 1436,
        height: 1000,
        metersPerPixel: 5,
    },
];

export default dropzones;
