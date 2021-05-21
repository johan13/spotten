export type Dropzone = {
  id: string,
  name: string,
  allowedLandingDirections?: number[],
  url: string,
  width: number,
  height: number,
};

const dropzones: Dropzone[] = [
  {
      id: "vargarda",
      name: "Vårgårda",
      allowedLandingDirections: [40, 220],
      url: "/maps/vargarda.png",
      width: 1436,
      height: 1000,
  },
  {
      id: "nasinge",
      name: "Näsinge",
      allowedLandingDirections: [30, 210],
      url: "/maps/nasinge.png",
      width: 1436,
      height: 1000,
  },
  {
      id: "skovde",
      name: "Skövde",
      allowedLandingDirections: [10, 190],
      url: "/maps/skovde.png",
      width: 1436,
      height: 1000,
  },
  {
    id: "koster",
    name: "Koster",
    url: "/maps/koster.png",
    width: 1436,
    height: 1000,
  },
];

export default dropzones;
