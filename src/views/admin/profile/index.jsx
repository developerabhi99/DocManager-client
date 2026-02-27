

// Chakra imports
import { Box, Grid } from "@chakra-ui/react";

// Custom components
import Banner from "views/admin/profile/components/Banner";
import General from "views/admin/profile/components/General";
import Projects from "views/admin/profile/components/Projects";
import Upload from "views/admin/profile/components/Upload";

// Assets
import banner from "assets/img/auth/banner.png";
import React from "react";
import { useAuth } from "contexts/AuthContext";

export default function Overview() {
  const { user } = useAuth();
  const userName = user?.name || user?.email || "User";
  const userRole = user?.role || "";
  const userImageUrl = user?.imageUrl || "";

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Main Fields */}
      <Grid
        templateColumns={{
          base: "1fr",
          lg: "1.34fr 1.62fr",
        }}
        templateRows={{
          base: "repeat(2, 1fr)",
          lg: "1fr",
        }}
        gap={{ base: "20px", xl: "20px" }}>
        <Banner
          gridArea='1 / 1 / 2 / 2'
          banner={banner}
          avatar={userImageUrl}
          name={userName}
          job={userRole}
          posts='17'
          followers='9.7k'
          following='274'
        />
        <Upload
          gridArea={{
            base: "2 / 1 / 3 / 2",
            lg: "1 / 2 / 2 / 3",
          }}
          minH={{ base: "auto", lg: "420px", "2xl": "365px" }}
          pe='20px'
          pb={{ base: "100px", lg: "20px" }}
        />
      </Grid>
      <Grid
        mb='20px'
        templateColumns={{
          base: "1fr",
          lg: "repeat(2, 1fr)",
          "2xl": "repeat(2, 1fr)",
        }}
        templateRows={{
          base: "repeat(2, 1fr)",
          lg: "1fr",
          "2xl": "1fr",
        }}
        gap={{ base: "20px", xl: "20px" }}>
        <Projects
          gridArea={{ base: "1 / 1 / 2 / 2", lg: "1 / 1 / 2 / 2" }}
          banner={banner}
          avatar={userImageUrl}
          name={userName}
          job={userRole}
          posts='17'
          followers='9.7k'
          following='274'
        />
        <General
          gridArea={{ base: "2 / 1 / 3 / 2", lg: "1 / 2 / 2 / 3" }}
          minH='365px'
          pe='20px'
        />
      </Grid>
    </Box>
  );
}
