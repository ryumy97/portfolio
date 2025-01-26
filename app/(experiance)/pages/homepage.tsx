'use client';

import GridContainer from '@/app/components/grid';
import { Description, HugeTitle } from '@/app/components/typography';
import HomeScene from '../scenes/home';
import { View } from '@/app/components/canvas/view';

const Homepage = () => {
  return (
    <>
      <GridContainer asChild>
        <main className="relative h-svh grid-rows-[auto_auto_1fr]">
          <HugeTitle className="col-span-6">Featured Projects</HugeTitle>
          <Description className="col-span-3 col-start-1 mt-6">Scroll down to see more</Description>
        </main>
      </GridContainer>
      <View className="absolute inset-0">
        <HomeScene />
      </View>
    </>
  );
};

export default Homepage;
