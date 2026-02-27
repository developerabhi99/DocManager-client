// Chakra imports
import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import PropTypes from "prop-types";
import React from "react";
import Footer from "components/footer/FooterAuth";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";
// Custom components
import { NavLink } from "react-router-dom";
// Assets
import { FaChevronLeft } from "react-icons/fa";

function AuthIllustration(props) {
  const { children, illustrationBackground } = props;
  // Chakra color mode
  return (
    <Flex position='relative' minH='100vh' w='100%'>
      <Flex
        w='100%'
        maxW={{ lg: '1313px' }}
        mx='auto'
        px={{ base: '0px', lg: '30px', xl: '0px' }}
        ps={{ xl: '70px' }}
        pt={{ base: '50px', md: '0px' }}
        direction={{ base: 'column', md: 'row' }}
        justifyContent='space-between'
        position='relative'
      >
        <Flex
          direction='column'
          flex='1'
          maxW={{ md: '520px', lg: '520px' }}
          w='100%'
          me={{ md: '40px' }}
        >
          <NavLink
            to='/admin'
            style={() => ({
              width: 'fit-content',
              marginTop: '40px',
            })}
          >
            <Flex
              align='center'
              ps={{ base: '25px', lg: '0px' }}
              pt={{ lg: '0px', xl: '0px' }}
              w='fit-content'
            >
              <Icon
                as={FaChevronLeft}
                me='12px'
                h='13px'
                w='8px'
                color='secondaryGray.600'
              />
              <Text ms='0px' fontSize='sm' color='secondaryGray.600'>
                Back to Simmmple
              </Text>
            </Flex>
          </NavLink>

          {children}
          <Footer />
        </Flex>

        <Box
          display={{ base: 'none', md: 'block' }}
          flex='1'
          position='relative'
          minH='100vh'
          w='100%'
        >
          <Flex
            bg={`url(${illustrationBackground})`}
            justify='center'
            align='end'
            w='100%'
            h='100%'
            bgSize='cover'
            bgPosition='50%'
            borderBottomLeftRadius={{ lg: '120px', xl: '200px' }}
          ></Flex>
        </Box>
      </Flex>
      <FixedPlugin />
    </Flex>
  );
}
// PROPS

AuthIllustration.propTypes = {
  illustrationBackground: PropTypes.string,
  image: PropTypes.any,
};

export default AuthIllustration;
